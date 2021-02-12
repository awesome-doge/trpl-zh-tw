## 共享狀態並發

> [ch16-03-shared-state.md](https://github.com/rust-lang/book/blob/master/src/ch16-03-shared-state.md) <br>
> commit ef072458f903775e91ea9e21356154bc57ee31da

雖然消息傳遞是一個很好的處理並發的方式，但並不是唯一一個。再一次思考一下 Go 程式語言文件中口號的這一部分：“不要透過共享記憶體來通訊”（“do not communicate by sharing memory.”）：

> What would communicating by sharing memory look like? In addition, why would message passing enthusiasts not use it and do the opposite instead?
>
> 透過共享記憶體通訊看起來如何？除此之外，為何消息傳遞的擁護者並不使用它並反其道而行之呢？

在某種程度上，任何程式語言中的通道都類似於單所有權，因為一旦將一個值傳送到通道中，將無法再使用這個值。共享記憶體類似於多所有權：多個執行緒可以同時訪問相同的記憶體位置。第十五章介紹了智慧指針如何使得多所有權成為可能，然而這會增加額外的複雜性，因為需要以某種方式管理這些不同的所有者。Rust 的類型系統和所有權規則極大的協助了正確地管理這些所有權。作為一個例子，讓我們看看互斥器，一個更為常見的共享記憶體並發原語。

### 互斥器一次只允許一個執行緒訪問數據

**互斥器**（_mutex_）是 _mutual exclusion_ 的縮寫，也就是說，任意時刻，其只允許一個執行緒訪問某些數據。為了訪問互斥器中的數據，執行緒首先需要通過獲取互斥器的 **鎖**（_lock_）來表明其希望訪問數據。鎖是一個作為互斥器一部分的數據結構，它記錄誰有數據的排他訪問權。因此，我們描述互斥器為通過鎖系統 **保護**（_guarding_）其數據。

互斥器以難以使用著稱，因為你不得不記住：

1. 在使用數據之前嘗試獲取鎖。
2. 處理完被互斥器所保護的數據之後，必須解鎖數據，這樣其他執行緒才能夠獲取鎖。

作為一個現實中互斥器的例子，想像一下在某個會議的一次小組座談會中，只有一個麥克風。如果一位成員要發言，他必須請求或表示希望使用麥克風。一旦得到了麥克風，他可以暢所欲言，然後將麥克風交給下一位希望講話的成員。如果一位成員結束發言後忘記將麥克風交還，其他人將無法發言。如果對共享麥克風的管理出現了問題，座談會將無法如期進行！

正確的管理互斥器異常複雜，這也是許多人之所以熱衷於通道的原因。然而，在 Rust 中，得益於類型系統和所有權，我們不會在鎖和解鎖上出錯。

### `Mutex<T>`的 API

作為展示如何使用互斥器的例子，讓我們從在單執行緒上下文使用互斥器開始，如範例 16-12 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap();
        *num = 6;
    }

    println!("m = {:?}", m);
}
```

<span class="caption">範例 16-12: 出於簡單的考慮，在一個單執行緒上下文中探索 `Mutex<T>` 的 API</span>

像很多類型一樣，我們使用關聯函數 `new` 來創建一個 `Mutex<T>`。使用 `lock` 方法獲取鎖，以訪問互斥器中的數據。這個調用會阻塞當前執行緒，直到我們擁有鎖為止。

如果另一個執行緒擁有鎖，並且那個執行緒 panic 了，則 `lock` 調用會失敗。在這種情況下，沒人能夠再獲取鎖，所以這裡選擇 `unwrap` 並在遇到這種情況時使執行緒 panic。

一旦獲取了鎖，就可以將返回值（在這裡是`num`）視為一個其內部數據的可變引用了。類型系統確保了我們在使用 `m` 中的值之前獲取鎖：`Mutex<i32>` 並不是一個 `i32`，所以 **必須** 獲取鎖才能使用這個 `i32` 值。我們是不會忘記這麼做的，因為反之類型系統不允許訪問內部的 `i32` 值。

正如你所懷疑的，`Mutex<T>` 是一個智慧指針。更準確的說，`lock` 調用 **返回** 一個叫做 `MutexGuard` 的智慧指針。這個智慧指針實現了 `Deref` 來指向其內部數據；其也提供了一個 `Drop` 實現當 `MutexGuard` 離開作用域時自動釋放鎖，這正發生於範例 16-12 內部作用域的結尾。為此，我們不會冒忘記釋放鎖並阻塞互斥器為其它執行緒所用的風險，因為鎖的釋放是自動發生的。

丟棄了鎖之後，可以列印出互斥器的值，並發現能夠將其內部的 `i32` 改為 6。

#### 在執行緒間共享 `Mutex<T>`

現在讓我們嘗試使用 `Mutex<T>` 在多個執行緒間共享值。我們將啟動十個執行緒，並在各個執行緒中對同一個計數器值加一，這樣計數器將從 0 變為 10。範例 16-13 中的例子會出現編譯錯誤，而我們將透過這些錯誤來學習如何使用 `Mutex<T>`，以及 Rust 又是如何幫助我們正確使用的。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

<span class="caption">範例 16-13: 程序啟動了 10 個執行緒，每個執行緒都通過 `Mutex<T>` 來增加計數器的值</span>

這裡創建了一個 `counter` 變數來存放內含 `i32` 的 `Mutex<T>`，類似範例 16-12 那樣。接下來遍歷 range 創建了 10 個執行緒。使用了 `thread::spawn` 並對所有執行緒使用了相同的閉包：他們每一個都將調用 `lock` 方法來獲取 `Mutex<T>` 上的鎖，接著將互斥器中的值加一。當一個執行緒結束執行，`num` 會離開閉包作用域並釋放鎖，這樣另一個執行緒就可以獲取它了。

在主執行緒中，我們像範例 16-2 那樣收集了所有的 join 句柄，調用它們的 `join` 方法來確保所有執行緒都會結束。這時，主執行緒會獲取鎖並列印出程序的結果。

之前提示過這個例子不能編譯，讓我們看看為什麼！

```text
error[E0382]: use of moved value: `counter`
  --> src/main.rs:9:36
   |
9  |         let handle = thread::spawn(move || {
   |                                    ^^^^^^^ value moved into closure here,
in previous iteration of loop
10 |             let mut num = counter.lock().unwrap();
   |                           ------- use occurs due to use in closure
   |
   = note: move occurs because `counter` has type `std::sync::Mutex<i32>`,
which does not implement the `Copy` trait
```

錯誤訊息表明 `counter` 值在上一次循環中被移動了。所以 Rust 告訴我們不能將 `counter` 鎖的所有權移動到多個執行緒中。讓我們透過一個第十五章討論過的多所有權手段來修復這個編譯錯誤。

#### 多執行緒和多所有權

在第十五章中，透過使用智慧指針 `Rc<T>` 來創建引用計數的值，以便擁有多所有者。讓我們在這也這麼做看看會發生什麼事。將範例 16-14 中的 `Mutex<T>` 封裝進 `Rc<T>` 中並在將所有權移入執行緒之前複製了 `Rc<T>`。現在我們理解了所發生的錯誤，同時也將代碼改回使用 `for` 循環，並保留閉包的 `move` 關鍵字：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Rc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

<span class="caption">範例 16-14: 嘗試使用 `Rc<T>` 來允許多個執行緒擁有 `Mutex<T>`</span>

再一次編譯並...出現了不同的錯誤！編譯器真是教會了我們很多！

```text
error[E0277]: `std::rc::Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely
  --> src/main.rs:11:22
   |
11 |         let handle = thread::spawn(move || {
   |                      ^^^^^^^^^^^^^ `std::rc::Rc<std::sync::Mutex<i32>>`
cannot be sent between threads safely
   |
   = help: within `[closure@src/main.rs:11:36: 14:10
counter:std::rc::Rc<std::sync::Mutex<i32>>]`, the trait `std::marker::Send`
is not implemented for `std::rc::Rc<std::sync::Mutex<i32>>`
   = note: required because it appears within the type
`[closure@src/main.rs:11:36: 14:10 counter:std::rc::Rc<std::sync::Mutex<i32>>]`
   = note: required by `std::thread::spawn`
```

哇哦，錯誤訊息太長不看！這裡是一些需要注意的重要部分：第一行錯誤表明 `` `std::rc::Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely ``。編譯器也告訴了我們原因 `` the trait bound `Send` is not satisfied ``。下一部分會講到 `Send`：這是確保所使用的類型可以用於並發環境的 trait 之一。

不幸的是，`Rc<T>` 並不能安全的在執行緒間共享。當 `Rc<T>` 管理引用計數時，它必須在每一個 `clone` 調用時增加計數，並在每一個複製被丟棄時減少計數。`Rc<T>` 並沒有使用任何並發原語，來確保改變計數的操作不會被其他執行緒打斷。在計數出錯時可能會導致詭異的 bug，比如可能會造成記憶體洩漏，或在使用結束之前就丟棄一個值。我們所需要的是一個完全類似 `Rc<T>`，又以一種執行緒安全的方式改變引用計數的類型。

#### 原子引用計數 `Arc<T>`

所幸 `Arc<T>` **正是** 這麼一個類似 `Rc<T>` 並可以安全的用於並發環境的類型。字母 “a” 代表 **原子性**（_atomic_），所以這是一個**原子引用計數**（_atomically reference counted_）類型。原子性是另一類這裡還未涉及到的並發原語：請查看標準庫中 `std::sync::atomic` 的文件來獲取更多細節。其中的要點就是：原子性類型工作起來類似原始類型，不過可以安全的在執行緒間共享。

你可能會好奇為什麼不是所有的原始類型都是原子性的？為什麼不是所有標準庫中的類型都預設使用 `Arc<T>` 實現？原因在於執行緒安全帶有性能懲罰，我們希望只在必要時才為此買單。如果只是在單執行緒中對值進行操作，原子性提供的保證並無必要，代碼可以因此運行的更快。

回到之前的例子：`Arc<T>` 和 `Rc<T>` 有著相同的 API，所以修改程序中的 `use` 行和 `new` 調用。範例 16-15 中的代碼最終可以編譯和運行：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

<span class="caption">範例 16-15: 使用 `Arc<T>` 包裝一個 `Mutex<T>` 能夠實現在多執行緒之間共享所有權</span>

這會列印出：

```text
Result: 10
```

成功了！我們從 0 數到了 10，這可能並不是很顯眼，不過一路上我們確實學習了很多關於 `Mutex<T>` 和執行緒安全的內容！這個例子中構建的結構可以用於比增加計數更為複雜的操作。使用這個策略，可將計算分成獨立的部分，分散到多個執行緒中，接著使用 `Mutex<T>` 使用各自的結算結果更新最終的結果。

### `RefCell<T>`/`Rc<T>` 與 `Mutex<T>`/`Arc<T>` 的相似性

你可能注意到了，因為 `counter` 是不可變的，不過可以獲取其內部值的可變引用；這意味著 `Mutex<T>` 提供了內部可變性，就像 `Cell` 系列類型那樣。正如第十五章中使用 `RefCell<T>` 可以改變 `Rc<T>` 中的內容那樣，同樣的可以使用 `Mutex<T>` 來改變 `Arc<T>` 中的內容。

另一個值得注意的細節是 Rust 不能避免使用 `Mutex<T>` 的全部邏輯錯誤。回憶一下第十五章使用 `Rc<T>` 就有造成引用循環的風險，這時兩個 `Rc<T>` 值相互引用，造成記憶體洩漏。同理，`Mutex<T>` 也有造成 **死鎖**（_deadlock_） 的風險。這發生於當一個操作需要鎖住兩個資源而兩個執行緒各持一個鎖，這會造成它們永遠相互等待。如果你對這個主題感興趣，嘗試編寫一個帶有死鎖的 Rust 程序，接著研究任何其他語言中使用互斥器的死鎖規避策略並嘗試在 Rust 中實現他們。標準庫中 `Mutex<T>` 和 `MutexGuard` 的 API 文件會提供有用的訊息。

接下來，為了豐富本章的內容，讓我們討論一下 `Send`和 `Sync` trait 以及如何對自訂類型使用他們。

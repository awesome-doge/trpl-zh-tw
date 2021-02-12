## 使用執行緒同時執行程式碼

> [ch16-01-threads.md](https://github.com/rust-lang/book/blob/master/src/ch16-01-threads.md) <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

在大部分現代操作系統中，已執行程序的代碼在一個 **進程**（_process_）中運行，操作系統則負責管理多個進程。在程序內部，也可以擁有多個同時執行的獨立部分。運行這些獨立部分的功能被稱為 **執行緒**（_threads_）。

將程序中的計算拆分進多個執行緒可以改善性能，因為程序可以同時進行多個任務，不過這也會增加複雜性。因為執行緒是同時執行的，所以無法預先保證不同執行緒中的代碼的執行順序。這會導致諸如此類的問題：

- 競爭狀態（Race conditions），多個執行緒以不一致的順序訪問數據或資源
- 死鎖（Deadlocks），兩個執行緒相互等待對方停止使用其所擁有的資源，這會阻止它們繼續運行
- 只會發生在特定情況且難以穩定重現和修復的 bug

Rust 嘗試減輕使用執行緒的負面影響。不過在多執行緒上下文中編程仍需格外小心，同時其所要求的代碼結構也不同於運行於單執行緒的程序。

程式語言有一些不同的方法來實現執行緒。很多操作系統提供了創建新執行緒的 API。這種由程式語言調用操作系統 API 創建執行緒的模型有時被稱為 _1:1_，一個 OS 執行緒對應一個語言執行緒。

很多程式語言提供了自己特殊的執行緒實現。程式語言提供的執行緒被稱為 **綠色**（_green_）執行緒，使用綠色執行緒的語言會在不同數量的 OS 執行緒的上下文中執行它們。為此，綠色執行緒模式被稱為 _M:N_ 模型：`M` 個綠色執行緒對應 `N` 個 OS 執行緒，這裡 `M` 和 `N` 不必相同。

每一個模型都有其優勢和取捨。對於 Rust 來說最重要的取捨是運行時支持。**運行時**（_Runtime_）是一個令人迷惑的概念，其在不同上下文中可能有不同的含義。

在當前上下文中，**運行時** 代表二進位制文件中包含的由語言自身提供的代碼。這些程式碼根據語言的不同可大可小，不過任何非匯編語言都會有一定數量的運行時代碼。為此，通常人們說一個語言 “沒有運行時”，一般意味著 “小運行時”。更小的運行時擁有更少的功能不過其優勢在於更小的二進位制輸出，這使其易於在更多上下文中與其他語言相結合。雖然很多語言覺得增加運行時來換取更多功能沒有什麼問題，但是 Rust 需要做到幾乎沒有運行時，同時為了保持高性能必須能夠調用 C 語言，這點也是不能妥協的。

綠色執行緒的 M:N 模型需要更大的語言運行時來管理這些執行緒。因此，Rust 標準庫只提供了 1:1 執行緒模型實現。由於 Rust 是較為底層的語言，如果你願意犧牲性能來換取抽象，以獲得對執行緒運行更精細的控制及更低的上下文切換成本，你可以使用實現了 M:N 執行緒模型的 crate。

現在我們明白了 Rust 中的執行緒是如何定義的，讓我們開始探索如何使用標準庫提供的執行緒相關的 API 吧。

### 使用 `spawn` 創建新執行緒

為了創建一個新執行緒，需要調用 `thread::spawn` 函數並傳遞一個閉包（第十三章學習了閉包），並在其中包含希望在新執行緒運行的代碼。範例 16-1 中的例子在主執行緒列印了一些文本而另一些文本則由新執行緒列印：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

<span class="caption">範例 16-1: 創建一個列印某些內容的新執行緒，但是主執行緒列印其它內容</span>

注意這個函數編寫的方式，當主執行緒結束時，新執行緒也會結束，而不管其是否執行完畢。這個程序的輸出可能每次都略有不同，不過它大體上看起來像這樣：

```text
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the main thread!
hi number 2 from the spawned thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
```

`thread::sleep` 調用強制執行緒停止執行一小段時間，這會允許其他不同的執行緒運行。這些執行緒可能會輪流運行，不過並不保證如此：這依賴操作系統如何調度執行緒。在這裡，主執行緒首先列印，即便新創建執行緒的列印語句位於程序的開頭，甚至即便我們告訴新建的執行緒列印直到 `i` 等於 9 ，它在主執行緒結束之前也只列印到了 5。

如果運行程式碼只看到了主執行緒的輸出，或沒有出現重疊列印的現象，嘗試增大區間 (變數 `i` 的範圍) 來增加操作系統切換執行緒的機會。

#### 使用 `join` 等待所有執行緒結束

由於主執行緒結束，範例 16-1 中的代碼大部分時候不光會提早結束新建執行緒，甚至不能實際保證新建執行緒會被執行。其原因在於無法保證執行緒運行的順序！

可以透過將 `thread::spawn` 的返回值儲存在變數中來修復新建執行緒部分沒有執行或者完全沒有執行的問題。`thread::spawn` 的返回值類型是 `JoinHandle`。`JoinHandle` 是一個擁有所有權的值，當對其調用 `join` 方法時，它會等待其執行緒結束。範例 16-2 展示了如何使用範例 16-1 中創建的執行緒的 `JoinHandle` 並調用 `join` 來確保新建執行緒在 `main` 退出前結束運行：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap();
}
```

<span class="caption">範例 16-2: 從 `thread::spawn` 保存一個 `JoinHandle` 以確保該執行緒能夠運行至結束</span>

透過調用 handle 的 `join` 會阻塞當前執行緒直到 handle 所代表的執行緒結束。**阻塞**（_Blocking_） 執行緒意味著阻止該執行緒執行工作或退出。因為我們將 `join` 調用放在了主執行緒的 `for` 循環之後，運行範例 16-2 應該會產生類似這樣的輸出：

```text
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 1 from the spawned thread!
hi number 3 from the main thread!
hi number 2 from the spawned thread!
hi number 4 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
```

這兩個執行緒仍然會交替執行，不過主執行緒會由於 `handle.join()` 調用會等待直到新建執行緒執行完畢。

不過讓我們看看將 `handle.join()` 移動到 `main` 中 `for` 循環之前會發生什麼事，如下：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    handle.join().unwrap();

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

主執行緒會等待直到新建執行緒執行完畢之後才開始執行 `for` 循環，所以輸出將不會交替出現，如下所示：

```text
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 4 from the main thread!
```

諸如將 `join` 放置於何處這樣的小細節，會影響執行緒是否同時執行。

### 執行緒與 `move` 閉包

`move` 閉包，我們曾在第十三章簡要的提到過，其經常與 `thread::spawn` 一起使用，因為它允許我們在一個執行緒中使用另一個執行緒的數據。

在第十三章中，我們講到可以在參數列表前使用 `move` 關鍵字強制閉包獲取其使用的環境值的所有權。這個技巧在創建新執行緒將值的所有權從一個執行緒移動到另一個執行緒時最為實用。

注意範例 16-1 中傳遞給 `thread::spawn` 的閉包並沒有任何參數：並沒有在新建執行緒代碼中使用任何主執行緒的數據。為了在新建執行緒中使用來自於主執行緒的數據，需要新建執行緒的閉包獲取它需要的值。範例 16-3 展示了一個嘗試在主執行緒中創建一個 vector 並用於新建執行緒的例子，不過這麼寫還不能工作，如下所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {:?}", v);
    });

    handle.join().unwrap();
}
```

<span class="caption">範例 16-3: 嘗試在另一個執行緒使用主執行緒創建的 vector</span>

閉包使用了 `v`，所以閉包會捕獲 `v` 並使其成為閉包環境的一部分。因為 `thread::spawn` 在一個新執行緒中運行這個閉包，所以可以在新執行緒中訪問 `v`。然而當編譯這個例子時，會得到如下錯誤：

```text
error[E0373]: closure may outlive the current function, but it borrows `v`,
which is owned by the current function
 --> src/main.rs:6:32
  |
6 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value `v`
7 |         println!("Here's a vector: {:?}", v);
  |                                           - `v` is borrowed here
  |
help: to force the closure to take ownership of `v` (and any other referenced
variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ^^^^^^^
```

Rust 會 **推斷** 如何捕獲 `v`，因為 `println!` 只需要 `v` 的引用，閉包嘗試借用 `v`。然而這有一個問題：Rust 不知道這個新建執行緒會執行多久，所以無法知曉 `v` 的引用是否一直有效。

範例 16-4 展示了一個 `v` 的引用很有可能不再有效的場景：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {:?}", v);
    });

    drop(v); // oh no!

    handle.join().unwrap();
}
```

<span class="caption">範例 16-4: 一個具有閉包的執行緒，嘗試使用一個在主執行緒中被回收的引用 `v`</span>

假如這段代碼能正常運行的話，則新建執行緒則可能會立刻被轉移到後台並完全沒有機會運行。新建執行緒內部有一個 `v` 的引用，不過主執行緒立刻就使用第十五章討論的 `drop` 丟棄了 `v`。接著當新建執行緒開始執行，`v` 已不再有效，所以其引用也是無效的。噢，這太糟了！

為了修復範例 16-3 的編譯錯誤，我們可以聽取錯誤訊息的建議：

```text
help: to force the closure to take ownership of `v` (and any other referenced
variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ^^^^^^^
```

通過在閉包之前增加 `move` 關鍵字，我們強制閉包獲取其使用的值的所有權，而不是任由 Rust 推斷它應該借用值。範例 16-5 中展示的對範例 16-3 代碼的修改，可以按照我們的預期編譯並運行：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("Here's a vector: {:?}", v);
    });

    handle.join().unwrap();
}
```

<span class="caption">範例 16-5: 使用 `move` 關鍵字強制獲取它使用的值的所有權</span>

那麼如果使用了 `move` 閉包，範例 16-4 中主執行緒調用了 `drop` 的代碼會發生什麼事呢？加了 `move` 就搞定了嗎？不幸的是，我們會得到一個不同的錯誤，因為範例 16-4 所嘗試的操作由於一個不同的原因而不被允許。如果為閉包增加 `move`，將會把 `v` 移動進閉包的環境中，如此將不能在主執行緒中對其調用 `drop` 了。我們會得到如下不同的編譯錯誤：

```text
error[E0382]: use of moved value: `v`
  --> src/main.rs:10:10
   |
6  |     let handle = thread::spawn(move || {
   |                                ------- value moved (into closure) here
...
10 |     drop(v); // oh no!
   |          ^ value used here after move
   |
   = note: move occurs because `v` has type `std::vec::Vec<i32>`, which does
   not implement the `Copy` trait
```

Rust 的所有權規則又一次幫助了我們！範例 16-3 中的錯誤是因為 Rust 是保守的並只會為執行緒借用 `v`，這意味著主執行緒理論上可能使新建執行緒的引用無效。通過告訴 Rust 將 `v` 的所有權移動到新建執行緒，我們向 Rust 保證主執行緒不會再使用 `v`。如果對範例 16-4 也做出如此修改，那麼當在主執行緒中使用 `v` 時就會違反所有權規則。 `move` 關鍵字覆蓋了 Rust 默認保守的借用，但它不允許我們違反所有權規則。

現在我們對執行緒和執行緒 API 有了基本的了解，讓我們討論一下使用執行緒實際可以 **做** 什麼吧。

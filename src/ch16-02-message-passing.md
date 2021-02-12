## 使用消息傳遞在執行緒間傳送數據

> [ch16-02-message-passing.md](https://github.com/rust-lang/book/blob/master/src/ch16-02-message-passing.md) <br>
> commit 26565efc3f62d9dacb7c2c6d0f5974360e459493

一個日益流行的確保安全並發的方式是 **消息傳遞**（_message passing_），這裡執行緒或 actor 透過發送包含數據的消息來相互溝通。這個思想來源於 [Go 程式語言文件中](http://golang.org/doc/effective_go.html) 的口號：“不要透過共享記憶體來通訊；而是透過通訊來共享記憶體。”（“Do not communicate by sharing memory; instead, share memory by communicating.”）

Rust 中一個實現消息傳遞並發的主要工具是 **通道**（_channel_），Rust 標準庫提供了其實現的程式概念。你可以將其想像為一個水流的通道，比如河流或小溪。如果你將諸如橡皮鴨或小船之類的東西放入其中，它們會順流而下到達下游。

編程中的通道有兩部分組成，一個發送者（transmitter）和一個接收者（receiver）。發送者位於上游位置，在這裡可以將橡皮鴨放入河中，接收者則位於下游，橡皮鴨最終會漂流至此。代碼中的一部分調用發送者的方法以及希望發送的數據，另一部分則檢查接收端收到的消息。當發送者或接收者任一被丟棄時可以認為通道被 **關閉**（_closed_）了。

這裡，我們將開發一個程序，它會在一個執行緒生成值向通道發送，而在另一個執行緒會接收值並列印出來。這裡會透過通道在執行緒間發送簡單值來示範這個功能。一旦你熟悉了這項技術，就能使用通道來實現聊天系統，或利用很多執行緒進行分布式計算並將部分計算結果發送給一個執行緒進行聚合。

首先，在範例 16-6 中，創建了一個通道但沒有做任何事。注意這還不能編譯，因為 Rust 不知道我們想要在通道中發送什麼類型：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
}
```

<span class="caption">範例 16-6: 創建一個通道，並將其兩端賦值給 `tx` 和 `rx`</span>

這裡使用 `mpsc::channel` 函數創建一個新的通道；`mpsc` 是 **多個生產者，單個消費者**（_multiple producer, single consumer_）的縮寫。簡而言之，Rust 標準庫實現通道的方式意味著一個通道可以有多個產生值的 **發送**（_sending_）端，但只能有一個消費這些值的 **接收**（_receiving_）端。想像一下多條小河小溪最終匯聚成大河：所有通過這些小河發出的東西最後都會來到下游的大河。目前我們以單個生產者開始，但是當範例可以工作後會增加多個生產者。

`mpsc::channel` 函數返回一個元組：第一個元素是發送端，而第二個元素是接收端。由於歷史原因，`tx` 和 `rx` 通常作為 **發送者**（_transmitter_）和 **接收者**（_receiver_）的縮寫，所以這就是我們將用來綁定這兩端變數的名字。這裡使用了一個 `let` 語句和模式來解構了此元組；第十八章會討論 `let` 語句中的模式和解構。如此使用 `let` 語句是一個方便提取 `mpsc::channel` 返回的元組中一部分的手段。

讓我們將發送端移動到一個新建執行緒中並發送一個字串，這樣新建執行緒就可以和主執行緒通訊了，如範例 16-7 所示。這類似於在河的上游扔下一隻橡皮鴨或從一個執行緒向另一個執行緒發送聊天訊息：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });
}
```

<span class="caption">範例 16-7: 將 `tx` 移動到一個新建的執行緒中並發送 “hi”</span>

這裡再次使用 `thread::spawn` 來創建一個新執行緒並使用 `move` 將 `tx` 移動到閉包中這樣新建執行緒就擁有 `tx` 了。新建執行緒需要擁有通道的發送端以便能向通道發送消息。

通道的發送端有一個 `send` 方法用來獲取需要放入通道的值。`send` 方法返回一個 `Result<T, E>` 類型，所以如果接收端已經被丟棄了，將沒有發送值的目標，所以發送操作會返回錯誤。在這個例子中，出錯的時候調用 `unwrap` 產生 panic。不過對於一個真實程序，需要合理地處理它：回到第九章複習正確處理錯誤的策略。

在範例 16-8 中，我們在主執行緒中從通道的接收端獲取值。這類似於在河的下游撈起橡皮鴨或接收聊天訊息：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("Got: {}", received);
}
```

<span class="caption">範例 16-8: 在主執行緒中接收並列印內容 “hi”</span>

通道的接收端有兩個有用的方法：`recv` 和 `try_recv`。這裡，我們使用了 `recv`，它是 _receive_ 的縮寫。這個方法會阻塞主執行緒執行直到從通道中接收一個值。一旦發送了一個值，`recv` 會在一個 `Result<T, E>` 中返回它。當通道發送端關閉，`recv` 會返回一個錯誤表明不會再有新的值到來了。

`try_recv` 不會阻塞，相反它立刻返回一個 `Result<T, E>`：`Ok` 值包含可用的訊息，而 `Err` 值代表此時沒有任何消息。如果執行緒在等待消息過程中還有其他工作時使用 `try_recv` 很有用：可以編寫一個循環來頻繁調用 `try_recv`，在有可用消息時進行處理，其餘時候則處理一會其他工作直到再次檢查。

出於簡單的考慮，這個例子使用了 `recv`；主執行緒中除了等待消息之外沒有任何其他工作，所以阻塞主執行緒是合適的。

如果運行範例 16-8 中的代碼，我們將會看到主執行緒列印出這個值：

```text
Got: hi
```

完美！

### 通道與所有權轉移

所有權規則在消息傳遞中扮演了重要角色，其有助於我們編寫安全的並發代碼。防止並發編程中的錯誤是在 Rust 程序中考慮所有權的一大優勢。現在讓我們做一個試驗來看看通道與所有權如何一同協作以避免產生問題：我們將嘗試在新建執行緒中的通道中發送完 `val` 值 **之後** 再使用它。嘗試編譯範例 16-9 中的代碼並看看為何這是不允許的：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::thread;
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
        println!("val is {}", val);
    });

    let received = rx.recv().unwrap();
    println!("Got: {}", received);
}
```

<span class="caption">範例 16-9: 在我們已經發送到通道中後，嘗試使用 `val` 引用</span>

這裡嘗試在通過 `tx.send` 發送 `val` 到通道中之後將其列印出來。允許這麼做是一個壞主意：一旦將值發送到另一個執行緒後，那個執行緒可能會在我們再次使用它之前就將其修改或者丟棄。其他執行緒對值可能的修改會由於不一致或不存在的數據而導致錯誤或意外的結果。然而，嘗試編譯範例 16-9 的代碼時，Rust 會給出一個錯誤：

```text
error[E0382]: use of moved value: `val`
  --> src/main.rs:10:31
   |
9  |         tx.send(val).unwrap();
   |                 --- value moved here
10 |         println!("val is {}", val);
   |                               ^^^ value used here after move
   |
   = note: move occurs because `val` has type `std::string::String`, which does
not implement the `Copy` trait
```

我們的並發錯誤會造成一個編譯時錯誤。`send` 函數獲取其參數的所有權並移動這個值歸接收者所有。這可以防止在發送後再次意外地使用這個值；所有權系統檢查一切是否合乎規則。

### 發送多個值並觀察接收者的等待

範例 16-8 中的代碼可以編譯和運行，不過它並沒有明確的告訴我們兩個獨立的執行緒通過通道相互通訊。範例 16-10 則有一些改進會證明範例 16-8 中的代碼是並發執行的：新建執行緒現在會發送多個消息並在每個消息之間暫停一秒鐘。

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {}", received);
    }
}
```

<span class="caption">範例 16-10: 發送多個消息，並在每次發送後暫停一段時間</span>

這一次，在新建執行緒中有一個字串 vector 希望發送到主執行緒。我們遍歷他們，單獨的發送每一個字串並通過一個 `Duration` 值調用 `thread::sleep` 函數來暫停一秒。

在主執行緒中，不再顯式調用 `recv` 函數：而是將 `rx` 當作一個疊代器。對於每一個接收到的值，我們將其列印出來。當通道被關閉時，疊代器也將結束。

當運行範例 16-10 中的代碼時，將看到如下輸出，每一行都會暫停一秒：

```text
Got: hi
Got: from
Got: the
Got: thread
```

因為主執行緒中的 `for` 循環裡並沒有任何暫停或等待的代碼，所以可以說主執行緒是在等待從新建執行緒中接收值。

### 透過複製發送者來創建多個生產者

之前我們提到了`mpsc`是 _multiple producer, single consumer_ 的縮寫。可以運用 `mpsc` 來擴展範例 16-10 中的代碼來創建向同一接收者發送值的多個執行緒。這可以透過複製通道的發送端來做到，如範例 16-11 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::thread;
# use std::sync::mpsc;
# use std::time::Duration;
#
# fn main() {
// --snip--

let (tx, rx) = mpsc::channel();

let tx1 = mpsc::Sender::clone(&tx);
thread::spawn(move || {
    let vals = vec![
        String::from("hi"),
        String::from("from"),
        String::from("the"),
        String::from("thread"),
    ];

    for val in vals {
        tx1.send(val).unwrap();
        thread::sleep(Duration::from_secs(1));
    }
});

thread::spawn(move || {
    let vals = vec![
        String::from("more"),
        String::from("messages"),
        String::from("for"),
        String::from("you"),
    ];

    for val in vals {
        tx.send(val).unwrap();
        thread::sleep(Duration::from_secs(1));
    }
});

for received in rx {
    println!("Got: {}", received);
}

// --snip--
# }
```

<span class="caption">範例 16-11: 從多個生產者發送多個消息</span>

這一次，在創建新執行緒之前，我們對通道的發送端調用了 `clone` 方法。這會給我們一個可以傳遞給第一個新建執行緒的發送端句柄。我們會將原始的通道發送端傳遞給第二個新建執行緒。這樣就會有兩個執行緒，每個執行緒將向通道的接收端發送不同的消息。

如果運行這些程式碼，你 **可能** 會看到這樣的輸出：

```text
Got: hi
Got: more
Got: from
Got: messages
Got: for
Got: the
Got: thread
Got: you
```

雖然你可能會看到這些值以不同的順序出現；這依賴於你的系統。這也就是並發既有趣又困難的原因。如果通過 `thread::sleep` 做實驗，在不同的執行緒中提供不同的值，就會發現他們的運行更加不確定，且每次都會產生不同的輸出。

現在我們見識過了通道如何工作，再看看另一種不同的並發方式吧。

## 優雅停機與清理

> [ch20-03-graceful-shutdown-and-cleanup.md](https://github.com/rust-lang/book/blob/master/src/ch20-03-graceful-shutdown-and-cleanup.md)
> <br>
> commit 9a5a1bfaec3b7763e1bcfd31a2fb19fe95183746

範例 20-21 中的代碼如期透過使用執行緒池非同步的響應請求。這裡有一些警告說 `workers`、`id` 和 `thread` 欄位沒有直接被使用，這提醒了我們並沒有清理所有的內容。當使用不那麼優雅的 <span class="keystroke">ctrl-c</span> 終止主執行緒時，所有其他執行緒也會立刻停止，即便它們正處於處理請求的過程中。

現在我們要為 `ThreadPool` 實現 `Drop` trait 對執行緒池中的每一個執行緒調用 `join`，這樣這些執行緒將會執行完他們的請求。接著會為 `ThreadPool` 實現一個告訴執行緒他們應該停止接收新請求並結束的方式。為了實踐這些程式碼，修改 server 在優雅停機（graceful shutdown）之前只接受兩個請求。

### 為 `ThreadPool` 實現 `Drop` Trait

現在開始為執行緒池實現 `Drop`。當執行緒池被丟棄時，應該 join 所有執行緒以確保他們完成其操作。範例 20-23 展示了 `Drop` 實現的第一次嘗試；這些程式碼還不能夠編譯：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

<span class="caption">範例 20-23: 當執行緒池離開作用域時 join 每個執行緒</span>

這裡首先遍歷執行緒池中的每個 `workers`。這裡使用了 `&mut` 因為 `self` 本身是一個可變引用而且也需要能夠修改 `worker`。對於每一個執行緒，會列印出說明訊息表明此特定 worker 正在關閉，接著在 worker 執行緒上調用 `join`。如果 `join` 調用失敗，通過 `unwrap` 使得 panic 並進行不優雅的關閉。

如下是嘗試編譯代碼時得到的錯誤：

```text
error[E0507]: cannot move out of borrowed content
  --> src/lib.rs:65:13
   |
65 |             worker.thread.join().unwrap();
   |             ^^^^^^ cannot move out of borrowed content
```

這告訴我們並不能調用 `join`，因為只有每一個 `worker` 的可變借用，而 `join` 獲取其參數的所有權。為了解決這個問題，需要一個方法將 `thread` 移動出擁有其所有權的 `Worker` 實例以便 `join` 可以消費這個執行緒。範例 17-15 中我們曾見過這麼做的方法：如果 `Worker` 存放的是 `Option<thread::JoinHandle<()>`，就可以在 `Option` 上調用 `take` 方法將值從 `Some` 成員中移動出來而對 `None` 成員不做處理。換句話說，正在運行的 `Worker` 的 `thread` 將是 `Some` 成員值，而當需要清理 worker 時，將 `Some` 替換為 `None`，這樣 worker 就沒有可以運行的執行緒了。

為此需要更新 `Worker` 的定義為如下：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# use std::thread;
struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}
```

現在依靠編譯器來找出其他需要修改的地方。check 代碼會得到兩個錯誤：

```text
error[E0599]: no method named `join` found for type
`std::option::Option<std::thread::JoinHandle<()>>` in the current scope
  --> src/lib.rs:65:27
   |
65 |             worker.thread.join().unwrap();
   |                           ^^^^

error[E0308]: mismatched types
  --> src/lib.rs:89:13
   |
89 |             thread,
   |             ^^^^^^
   |             |
   |             expected enum `std::option::Option`, found struct
   `std::thread::JoinHandle`
   |             help: try using a variant of the expected type: `Some(thread)`
   |
   = note: expected type `std::option::Option<std::thread::JoinHandle<()>>`
              found type `std::thread::JoinHandle<_>`
```

讓我們修復第二個錯誤，它指向 `Worker::new` 結尾的代碼；當新建 `Worker` 時需要將 `thread` 值封裝進 `Some`。做出如下改變以修復問題：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        // --snip--

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

第一個錯誤位於 `Drop` 實現中。之前提到過要調用 `Option` 上的 `take` 將 `thread` 移動出 `worker`。如下改變會修復問題：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}
```

如第十七章我們見過的，`Option` 上的 `take` 方法會取出 `Some` 而留下 `None`。使用 `if let` 解構 `Some` 並得到執行緒，接著在執行緒上調用 `join`。如果 worker 的執行緒已然是 `None`，就知道此時這個 worker 已經清理了其執行緒所以無需做任何操作。

### 向執行緒發送信號使其停止接收任務

有了所有這些修改，代碼就能編譯且沒有任何警告。不過也有壞消息，這些程式碼還不能以我們期望的方式運行。問題的關鍵在於 `Worker` 中分配的執行緒所運行的閉包中的邏輯：調用 `join` 並不會關閉執行緒，因為他們一直 `loop` 來尋找任務。如果採用這個實現來嘗試丟棄 `ThreadPool` ，則主執行緒會永遠阻塞在等待第一個執行緒結束上。

為了修復這個問題，修改執行緒既監聽是否有 `Job` 運行也要監聽一個應該停止監聽並退出無限循環的信號。所以通道將發送這個枚舉的兩個成員之一而不是 `Job` 實例：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# struct Job;
enum Message {
    NewJob(Job),
    Terminate,
}
```

`Message` 枚舉要嘛是存放了執行緒需要運行的 `Job` 的 `NewJob` 成員，要嘛是會導致執行緒退出循環並終止的 `Terminate` 成員。

同時需要修改通道來使用 `Message` 類型值而不是 `Job`，如範例 20-24 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Message>,
}

// --snip--

impl ThreadPool {
    // --snip--

    pub fn execute<F>(&self, f: F)
        where
            F: FnOnce() + Send + 'static
    {
        let job = Box::new(f);

        self.sender.send(Message::NewJob(job)).unwrap();
    }
}

// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Message>>>) ->
        Worker {

        let thread = thread::spawn(move ||{
            loop {
                let message = receiver.lock().unwrap().recv().unwrap();

                match message {
                    Message::NewJob(job) => {
                        println!("Worker {} got a job; executing.", id);

                        job();
                    },
                    Message::Terminate => {
                        println!("Worker {} was told to terminate.", id);

                        break;
                    },
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

<span class="caption">範例 20-24: 收發 `Message` 值並在 `Worker` 收到 `Message::Terminate` 時退出循環</span>

為了適用 `Message` 枚舉需要將兩個地方的 `Job` 修改為 `Message`：`ThreadPool` 的定義和 `Worker::new` 的簽名。`ThreadPool` 的 `execute` 方法需要發送封裝進 `Message::NewJob` 成員的任務。然後，在 `Worker::new` 中當從通道接收 `Message` 時，當獲取到 `NewJob`成員會處理任務而收到 `Terminate` 成員則會退出循環。

通過這些修改，代碼再次能夠編譯並繼續按照範例 20-21 之後相同的行為運行。不過還是會得到一個警告，因為並沒有創建任何 `Terminate` 成員的消息。如範例 20-25 所示修改 `Drop` 實現來修復此問題：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Drop for ThreadPool {
    fn drop(&mut self) {
        println!("Sending terminate message to all workers.");

        for _ in &mut self.workers {
            self.sender.send(Message::Terminate).unwrap();
        }

        println!("Shutting down all workers.");

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}
```

<span class="caption">範例 20-25：在對每個 worker 執行緒調用 `join` 之前向 worker 發送 `Message::Terminate`</span>

現在遍歷了 worker 兩次，一次向每個 worker 發送一個 `Terminate` 消息，一個調用每個 worker 執行緒上的 `join`。如果嘗試在同一循環中發送消息並立即 join 執行緒，則無法保證當前疊代的 worker 是從通道收到終止消息的 worker。

為了更好的理解為什麼需要兩個分開的循環，想像一下只有兩個 worker 的場景。如果在一個單獨的循環中遍歷每個 worker，在第一次疊代中向通道發出終止消息並對第一個 worker 執行緒調用 `join`。如果此時第一個 worker 正忙於處理請求，那麼第二個 worker 會收到終止消息並停止。我們會一直等待第一個 worker 結束，不過它永遠也不會結束因為第二個執行緒接收了終止消息。死鎖！

為了避免此情況，首先在一個循環中向通道發出所有的 `Terminate` 消息，接著在另一個循環中 join 所有的執行緒。每個 worker 一旦收到終止消息即會停止從通道接收消息，意味著可以確保如果發送同 worker 數相同的終止消息，在 join 之前每個執行緒都會收到一個終止消息。

為了實踐這些程式碼，如範例 20-26 所示修改 `main` 在優雅停機 server 之前只接受兩個請求：

<span class="filename">檔案名: src/bin/main.rs</span>

```rust,ignore
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}
```

<span class="caption">範例 20-26: 在處理兩個請求之後透過退出循環來停止 server</span>

你不會希望真實世界的 web server 只處理兩次請求就停機了，這只是為了展示優雅停機和清理處於正常工作狀態。

`take` 方法定義於 `Iterator` trait，這裡限制循環最多頭 2 次。`ThreadPool` 會在 `main` 的結尾離開作用域，而且還會看到 `drop` 實現的運行。

使用 `cargo run` 啟動 server，並發起三個請求。第三個請求應該會失敗，而終端的輸出應該看起來像這樣：

```text
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished dev [unoptimized + debuginfo] target(s) in 1.0 secs
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 3 got a job; executing.
Shutting down.
Sending terminate message to all workers.
Shutting down all workers.
Shutting down worker 0
Worker 1 was told to terminate.
Worker 2 was told to terminate.
Worker 0 was told to terminate.
Worker 3 was told to terminate.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

可能會出現不同順序的 worker 和訊息輸出。可以從訊息中看到服務是如何運行的： worker 0 和 worker 3 獲取了頭兩個請求，接著在第三個請求時，我們停止接收連接。當 `ThreadPool` 在 `main` 的結尾離開作用域時，其 `Drop` 實現開始工作，執行緒池通知所有執行緒終止。每個 worker 在收到終止消息時會列印出一個訊息，接著執行緒池調用 `join` 來終止每一個 worker 執行緒。

這個特定的運行過程中一個有趣的地方在於：注意我們向通道中發出終止消息，而在任何執行緒收到消息之前，就嘗試 join worker 0 了。worker 0 還沒有收到終止消息，所以主執行緒阻塞直到 worker 0 結束。與此同時，每一個執行緒都收到了終止消息。一旦 worker 0 結束，主執行緒就等待其他 worker 結束，此時他們都已經收到終止消息並能夠停止了。

恭喜！現在我們完成了這個項目，也有了一個使用執行緒池非同步響應請求的基礎 web server。我們能對 server 執行優雅停機，它會清理執行緒池中的所有執行緒。

如下是完整的代碼參考：

<span class="filename">檔案名: src/bin/main.rs</span>

```rust,ignore
use hello::ThreadPool;

use std::io::prelude::*;
use std::net::TcpListener;
use std::net::TcpStream;
use std::fs;
use std::thread;
use std::time::Duration;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    let get = b"GET / HTTP/1.1\r\n";
    let sleep = b"GET /sleep HTTP/1.1\r\n";

    let (status_line, filename) = if buffer.starts_with(get) {
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else if buffer.starts_with(sleep) {
        thread::sleep(Duration::from_secs(5));
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND\r\n\r\n", "404.html")
    };

    let contents = fs::read_to_string(filename).unwrap();

    let response = format!("{}{}", status_line, contents);

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
```

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::thread;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::Mutex;

enum Message {
    NewJob(Job),
    Terminate,
}

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Message>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// 創建執行緒池。
    ///
    /// 執行緒池中執行緒的數量。
    ///
    /// # Panics
    ///
    /// `new` 函數在 size 為 0 時會 panic。
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender,
        }
    }

    pub fn execute<F>(&self, f: F)
        where
            F: FnOnce() + Send + 'static
    {
        let job = Box::new(f);

        self.sender.send(Message::NewJob(job)).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        println!("Sending terminate message to all workers.");

        for _ in &mut self.workers {
            self.sender.send(Message::Terminate).unwrap();
        }

        println!("Shutting down all workers.");

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Message>>>) ->
        Worker {

        let thread = thread::spawn(move ||{
            loop {
                let message = receiver.lock().unwrap().recv().unwrap();

                match message {
                    Message::NewJob(job) => {
                        println!("Worker {} got a job; executing.", id);

                        job();
                    },
                    Message::Terminate => {
                        println!("Worker {} was told to terminate.", id);

                        break;
                    },
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

這裡還有很多可以做的事！如果你希望繼續增強這個項目，如下是一些點子：

- 為 `ThreadPool` 和其公有方法增加更多文件
- 為庫的功能增加測試
- 將 `unwrap` 調用改為更健壯的錯誤處理
- 使用 `ThreadPool` 進行其他不同於處理網路請求的任務
- 在 [crates.io](https://crates.io/) 上尋找一個執行緒池 crate 並使用它實現一個類似的 web server，將其 API 和強健性與我們的實現做對比

## 總結

好極了！你結束了本書的學習！由衷感謝你同我們一道加入這次 Rust 之旅。現在你已經準備好出發並實現自己的 Rust 項目並幫助他人了。請不要忘記我們的社區，這裡有其他 Rustaceans 正樂於幫助你迎接 Rust 之路上的任何挑戰。

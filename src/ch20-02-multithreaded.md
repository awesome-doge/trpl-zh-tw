## 將單執行緒 server 變為多執行緒 server

> [ch20-02-multithreaded.md](https://github.com/rust-lang/book/blob/master/src/ch20-02-multithreaded.md)
> <br>
> commit 120e76a0cc77c9cde52643f847ed777f8f441817

目前 server 會依次處理每一個請求，意味著它在完成第一個連接的處理之前不會處理第二個連接。如果 server 正接收越來越多的請求，這類串列操作會使性能越來越差。如果一個請求花費很長時間來處理，隨後而來的請求則不得不等待這個長請求結束，即便這些新請求可以很快就處理完。我們需要修復這種情況，不過首先讓我們實際嘗試一下這個問題。

### 在當前 server 實現中模擬慢請求

讓我們看看一個慢請求如何影響當前 server 實現中的其他請求。範例 20-10 通過模擬慢響應實現了 */sleep* 請求處理，它會使 server 在響應之前休眠五秒。

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::thread;
use std::time::Duration;
# use std::io::prelude::*;
# use std::net::TcpStream;
# use std::fs::File;
// --snip--

fn handle_connection(mut stream: TcpStream) {
#     let mut buffer = [0; 512];
#     stream.read(&mut buffer).unwrap();
    // --snip--

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

    // --snip--
}
```

<span class="caption">範例 20-10: 通過識別 */sleep* 並休眠五秒來模擬慢請求</span>

這段代碼有些凌亂，不過對於模擬的目的來說已經足夠。這裡創建了第二個請求 `sleep`，我們會識別其數據。在 `if` 塊之後增加了一個 `else if` 來檢查 */sleep* 請求，當接收到這個請求時，在渲染成功 HTML 頁面之前會先休眠五秒。

現在就可以真切的看出我們的 server 有多麼的原始：真實的庫將會以更簡潔的方式處理多請求識別問題！

使用 `cargo run` 啟動 server，並接著打開兩個瀏覽器窗口：一個請求 *http://127.0.0.1:7878/* 而另一個請求 *http://127.0.0.1:7878/sleep* 。如果像之前一樣多次請求 */*，會發現響應的比較快速。不過如果請求 */sleep* 之後在請求 */*，就會看到 */* 會等待直到 `sleep` 休眠完五秒之後才出現。

這裡有多種辦法來改變我們的 web server 使其避免所有請求都排在慢請求之後；我們將要實現的一個便是執行緒池。

### 使用執行緒池改善吞吐量

**執行緒池**（*thread pool*）是一組預先分配的等待或準備處理任務的執行緒。當程序收到一個新任務，執行緒池中的一個執行緒會被分配任務，這個執行緒會離開並處理任務。其餘的執行緒則可用於處理在第一個執行緒處理任務的同時處理其他接收到的任務。當第一個執行緒處理完任務時，它會返回空閒執行緒池中等待處理新任務。執行緒池允許我們並發處理連接，增加 server 的吞吐量。

我們會將池中執行緒限制為較少的數量，以防拒絕服務（Denial of Service， DoS）攻擊；如果程序為每一個接收的請求都新建一個執行緒，某人向 server 發起千萬級的請求時會耗盡伺服器的資源並導致所有請求的處理都被終止。

不同於分配無限的執行緒，執行緒池中將有固定數量的等待執行緒。當新進請求時，將請求發送到執行緒池中做處理。執行緒池會維護一個接收請求的隊列。每一個執行緒會從隊列中取出一個請求，處理請求，接著向對隊列索取另一個請求。通過這種設計，則可以並發處理 `N` 個請求，其中 `N` 為執行緒數。如果每一個執行緒都在響應慢請求，之後的請求仍然會阻塞隊列，不過相比之前增加了能處理的慢請求的數量。

這個設計僅僅是多種改善 web server 吞吐量的方法之一。其他可供探索的方法有 fork/join 模型和單執行緒非同步 I/O 模型。如果你對這個主題感興趣，則可以閱讀更多關於其他解決方案的內容並嘗試用 Rust 實現他們；對於一個像 Rust 這樣的底層語言，所有這些方法都是可能的。

在開始之前，讓我們討論一下執行緒池應用看起來怎樣。當嘗試設計代碼時，首先編寫用戶端介面確實有助於指導代碼設計。以期望的調用方式來構建 API 代碼的結構，接著在這個結構之內實現功能，而不是先實現功能再設計公有 API。

類似於第十二章項目中使用的測試驅動開發。這裡將要使用編譯器驅動開發（compiler-driven development）。我們將編寫調用所期望的函數的代碼，接著觀察編譯器錯誤告訴我們接下來需要修改什麼使得代碼可以工作。

#### 為每一個請求分配執行緒的代碼結構

首先，讓我們探索一下為每一個連接都創建一個執行緒的代碼看起來如何。這並不是最終方案，因為正如之前講到的它會潛在的分配無限的執行緒，不過這是一個開始。範例 20-11 展示了 `main` 的改變，它在 `for` 循環中為每一個流分配了一個新執行緒進行處理：

<span class="filename">檔案名: src/main.rs</span>

```rust,no_run
# use std::thread;
# use std::io::prelude::*;
# use std::net::TcpListener;
# use std::net::TcpStream;
#
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        thread::spawn(|| {
            handle_connection(stream);
        });
    }
}
# fn handle_connection(mut stream: TcpStream) {}
```

<span class="caption">範例 20-11: 為每一個流新建一個執行緒</span>

正如第十六章講到的，`thread::spawn` 會創建一個新執行緒並在其中運行閉包中的代碼。如果運行這段代碼並在在瀏覽器中載入 */sleep*，接著在另兩個瀏覽器標籤頁中載入 */*，確實會發現 */* 請求不必等待 */sleep* 結束。不過正如之前提到的，這最終會使系統崩潰因為我們無限制的創建新執行緒。

#### 為有限數量的執行緒創建一個類似的介面

我們期望執行緒池以類似且熟悉的方式工作，以便從執行緒切換到執行緒池並不會對使用該 API 的代碼做出較大的修改。範例 20-12 展示我們希望用來替換 `thread::spawn` 的 `ThreadPool` 結構體的假想介面：

<span class="filename">檔案名: src/main.rs</span>

```rust,no_run
# use std::thread;
# use std::io::prelude::*;
# use std::net::TcpListener;
# use std::net::TcpStream;
# struct ThreadPool;
# impl ThreadPool {
#    fn new(size: u32) -> ThreadPool { ThreadPool }
#    fn execute<F>(&self, f: F)
#        where F: FnOnce() + Send + 'static {}
# }
#
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}
# fn handle_connection(mut stream: TcpStream) {}
```

<span class="caption">範例 20-12: 假想的 `ThreadPool` 介面</span>

這裡使用 `ThreadPool::new` 來創建一個新的執行緒池，它有一個可配置的執行緒數的參數，在這裡是四。這樣在 `for` 循環中，`pool.execute` 有著類似 `thread::spawn` 的介面，它獲取一個執行緒池運行於每一個流的閉包。`pool.execute` 需要實現為獲取閉包並傳遞給池中的執行緒運行。這段代碼還不能編譯，不過通過嘗試編譯器會指導我們如何修復它。

#### 採用編譯器驅動構建 `ThreadPool` 結構體

繼續並對範例 20-12 中的 *src/main.rs* 做出修改，並利用來自 `cargo check` 的編譯器錯誤來驅動開發。下面是我們得到的第一個錯誤：

```text
$ cargo check
   Compiling hello v0.1.0 (file:///projects/hello)
error[E0433]: failed to resolve. Use of undeclared type or module `ThreadPool`
  --> src\main.rs:10:16
   |
10 |     let pool = ThreadPool::new(4);
   |                ^^^^^^^^^^^^^^^ Use of undeclared type or module
   `ThreadPool`

error: aborting due to previous error
```

好的，這告訴我們需要一個 `ThreadPool` 類型或模組，所以我們將構建一個。`ThreadPool` 的實現會與 web server 的特定工作相獨立，所以讓我們從 `hello` crate 切換到存放 `ThreadPool` 實現的新庫 crate。這也意味著可以在任何工作中使用這個單獨的執行緒池庫，而不僅僅是處理網路請求。

創建 *src/lib.rs* 文件，它包含了目前可用的最簡單的 `ThreadPool` 定義：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub struct ThreadPool;
```

接著創建一個新目錄，*src/bin*，並將二進位制 crate 根文件從 *src/main.rs* 移動到 *src/bin/main.rs*。這使得庫 crate 成為 *hello* 目錄的主要 crate；不過仍然可以使用 `cargo run` 運行 *src/bin/main.rs* 二進位制文件。移動了 *main.rs* 文件之後，修改 *src/bin/main.rs* 文件開頭加入如下代碼來引入庫 crate 並將 `ThreadPool` 引入作用域：

<span class="filename">檔案名: src/bin/main.rs</span>

```rust,ignore
use hello::ThreadPool;
```

這仍然不能工作，再次嘗試運行來得到下一個需要解決的錯誤：

```text
$ cargo check
   Compiling hello v0.1.0 (file:///projects/hello)
error[E0599]: no function or associated item named `new` found for type
`hello::ThreadPool` in the current scope
 --> src/bin/main.rs:13:16
   |
13 |     let pool = ThreadPool::new(4);
   |                ^^^^^^^^^^^^^^^ function or associated item not found in
   `hello::ThreadPool`
```

這告訴我們下一步是為 `ThreadPool` 創建一個叫做 `new` 的關聯函數。我們還知道 `new` 需要有一個參數可以接受 `4`，而且 `new` 應該返回 `ThreadPool` 實例。讓我們實現擁有此特徵的最小化 `new` 函數：

<span class="filename">文件夾: src/lib.rs</span>

```rust
pub struct ThreadPool;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        ThreadPool
    }
}
```

這裡選擇 `usize` 作為 `size` 參數的類型，因為我們知道為負的執行緒數沒有意義。我們還知道將使用 4 作為執行緒集合的元素數量，這也就是使用 `usize` 類型的原因，如第三章 [“整數類型”][integer-types] 部分所講。

再次編譯檢查這段代碼：

```text
$ cargo check
   Compiling hello v0.1.0 (file:///projects/hello)
warning: unused variable: `size`
 --> src/lib.rs:4:16
  |
4 |     pub fn new(size: usize) -> ThreadPool {
  |                ^^^^
  |
  = note: #[warn(unused_variables)] on by default
  = note: to avoid this warning, consider using `_size` instead

error[E0599]: no method named `execute` found for type `hello::ThreadPool` in the current scope
  --> src/bin/main.rs:18:14
   |
18 |         pool.execute(|| {
   |              ^^^^^^^
```

現在有了一個警告和一個錯誤。暫時先忽略警告，發生錯誤是因為並沒有 `ThreadPool` 上的 `execute` 方法。回憶 [“為有限數量的執行緒創建一個類似的介面”](#creating-a-similar-interface-for-a-finite-number-of-threads)  部分我們決定執行緒池應該有與 `thread::spawn` 類似的介面，同時我們將實現 `execute` 函數來獲取傳遞的閉包並將其傳遞給池中的空閒執行緒執行。

我們會在 `ThreadPool` 上定義 `execute` 函數來獲取一個閉包參數。回憶第十三章的 [“使用帶有泛型和 `Fn` trait 的閉包”][storing-closures-using-generic-parameters-and-the-fn-traits] 部分，閉包作為參數時可以使用三個不同的 trait：`Fn`、`FnMut` 和 `FnOnce`。我們需要決定這裡應該使用哪種閉包。最終需要實現的類似於標準庫的 `thread::spawn`，所以我們可以觀察 `thread::spawn` 的簽名在其參數中使用了何種 bound。查看文件會發現：

```rust,ignore
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T + Send + 'static,
        T: Send + 'static
```

`F` 是這裡我們關心的參數；`T` 與返回值有關所以我們並不關心。考慮到 `spawn` 使用 `FnOnce` 作為 `F` 的 trait bound，這可能也是我們需要的，因為最終會將傳遞給 `execute` 的參數傳給 `spawn`。因為處理請求的執行緒只會執行閉包一次，這也進一步確認了 `FnOnce` 是我們需要的 trait，這裡符合 `FnOnce` 中 `Once` 的意思。

`F` 還有 trait bound `Send` 和生命週期綁定 `'static`，這對我們的情況也是有意義的：需要 `Send` 來將閉包從一個執行緒轉移到另一個執行緒，而 `'static` 是因為並不知道執行緒會執行多久。讓我們編寫一個使用帶有這些 bound 的泛型參數 `F` 的 `ThreadPool` 的 `execute` 方法：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub struct ThreadPool;
impl ThreadPool {
    // --snip--

    pub fn execute<F>(&self, f: F)
        where
            F: FnOnce() + Send + 'static
    {

    }
}
```

`FnOnce` trait 仍然需要之後的 `()`，因為這裡的 `FnOnce` 代表一個沒有參數也沒有返回值的閉包。正如函數的定義，返回值類型可以從簽名中省略，不過即便沒有參數也需要括號。

這裡再一次增加了 `execute` 方法的最小化實現：它沒有做任何工作，只是嘗試讓代碼能夠編譯。再次進行檢查：

```text
$ cargo check
   Compiling hello v0.1.0 (file:///projects/hello)
warning: unused variable: `size`
 --> src/lib.rs:4:16
  |
4 |     pub fn new(size: usize) -> ThreadPool {
  |                ^^^^
  |
  = note: #[warn(unused_variables)] on by default
  = note: to avoid this warning, consider using `_size` instead

warning: unused variable: `f`
 --> src/lib.rs:8:30
  |
8 |     pub fn execute<F>(&self, f: F)
  |                              ^
  |
  = note: to avoid this warning, consider using `_f` instead
```

現在就只有警告了！這意味著能夠編譯了！注意如果嘗試 `cargo run` 運行程序並在瀏覽器中發起請求，仍會在瀏覽器中出現在本章開始時那樣的錯誤。這個庫實際上還沒有調用傳遞給 `execute` 的閉包！

> 一個你可能聽說過的關於像 Haskell 和 Rust 這樣有嚴格編譯器的語言的說法是 “如果代碼能夠編譯，它就能工作”。這是一個提醒大家的好時機，實際上這並不是普適的。我們的項目可以編譯，不過它完全沒有做任何工作！如果構建一個真實且功能完整的項目，則需花費大量的時間來開始編寫單元測試來檢查代碼能否編譯 **並且** 擁有期望的行為。

#### 在 `new` 中驗證池中執行緒數量

這裡仍然存在警告是因為其並沒有對 `new` 和 `execute` 的參數做任何操作。讓我們用期望的行為來實現這些函數。以考慮 `new` 作為開始。之前選擇使用無符號類型作為 `size` 參數的類型，因為執行緒數為負的執行緒池沒有意義。然而，執行緒數為零的執行緒池同樣沒有意義，不過零是一個完全有效的 `u32` 值。讓我們增加在返回 `ThreadPool` 實例之前檢查 `size` 是否大於零的代碼，並使用 `assert!` 宏在得到零時 panic，如範例 20-13 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub struct ThreadPool;
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

        ThreadPool
    }

    // --snip--
}
```

<span class="caption">範例 20-13: 實現 `ThreadPool::new` 在 `size` 為零時 panic</span>

這裡用文件注釋為 `ThreadPool` 增加了一些文件。注意這裡遵循了良好的文件實踐並增加了一個部分來提示函數會 panic 的情況，正如第十四章所討論的。嘗試運行 `cargo doc --open` 並點擊 `ThreadPool` 結構體來查看生成的 `new` 的文件看起來如何！

相比像這裡使用 `assert!` 宏，也可以讓 `new` 像之前 I/O 項目中範例 12-9 中 `Config::new` 那樣返回一個 `Result`，不過在這裡我們選擇創建一個沒有任何執行緒的執行緒池應該是不可恢復的錯誤。如果你想做的更好，嘗試編寫一個採用如下簽名的 `new` 版本來感受一下兩者的區別：

```rust,ignore
pub fn new(size: usize) -> Result<ThreadPool, PoolCreationError> {
```

#### 分配空間以儲存執行緒

現在有了一個有效的執行緒池執行緒數，就可以實際創建這些執行緒並在返回之前將他們儲存在 `ThreadPool` 結構體中。不過如何 “儲存” 一個執行緒？讓我們再看看 `thread::spawn` 的簽名：

```rust,ignore
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T + Send + 'static,
        T: Send + 'static
```

`spawn` 返回 `JoinHandle<T>`，其中 `T` 是閉包返回的類型。嘗試使用 `JoinHandle` 來看看會發生什麼事。在我們的情況中，傳遞給執行緒池的閉包會處理連接並不返回任何值，所以 `T` 將會是單元類型 `()`。

範例 20-14 中的代碼可以編譯，不過實際上還並沒有創建任何執行緒。我們改變了 `ThreadPool` 的定義來存放一個 `thread::JoinHandle<()>` 的 vector 實例，使用 `size` 容量來初始化，並設置一個 `for` 循環了來運行創建執行緒的代碼，並返回包含這些執行緒的 `ThreadPool` 實例：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,not_desired_behavior
use std::thread;

pub struct ThreadPool {
    threads: Vec<thread::JoinHandle<()>>,
}

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut threads = Vec::with_capacity(size);

        for _ in 0..size {
            // create some threads and store them in the vector
        }

        ThreadPool {
            threads
        }
    }

    // --snip--
}
```

<span class="caption">範例 20-14: 為 `ThreadPool` 創建一個 vector 來存放執行緒</span>

這裡將 `std::thread` 引入庫 crate 的作用域，因為使用了 `thread::JoinHandle` 作為 `ThreadPool` 中 vector 元素的類型。

在得到了有效的數量之後，`ThreadPool` 新建一個存放 `size` 個元素的 vector。本書還未使用過 `with_capacity`，它與 `Vec::new` 做了同樣的工作，不過有一個重要的區別：它為 vector 預先分配空間。因為已經知道了 vector 中需要 `size` 個元素，預先進行分配比僅僅 `Vec::new` 要稍微有效率一些，因為 `Vec::new` 隨著插入元素而重新改變大小。

如果再次運行 `cargo check`，會看到一些警告，不過應該可以編譯成功。

#### `Worker` 結構體負責從 `ThreadPool` 中將代碼傳遞給執行緒

範例 20-14 的 `for` 循環中留下了一個關於創建執行緒的注釋。如何實際創建執行緒呢？這是一個難題。標準庫提供的創建執行緒的方法，`thread::spawn`，它期望獲取一些一旦創建執行緒就應該執行的代碼。然而，我們希望開始執行緒並使其等待稍後傳遞的代碼。標準庫的執行緒實現並沒有包含這麼做的方法；我們必須自己實現。

我們將要實現的行為是創建執行緒並稍後發送代碼，這會在 `ThreadPool` 和執行緒間引入一個新數據類型來管理這種新行為。這個數據結構稱為 `Worker`：這是一個池實現中的常見概念。想像一下在餐館廚房工作的員工：員工等待來自客戶的訂單，他們負責接受這些訂單並完成它們。

不同於在執行緒池中儲存一個 `JoinHandle<()>` 實例的 vector，我們會儲存 `Worker` 結構體的實例。每一個 `Worker` 會儲存一個單獨的 `JoinHandle<()>` 實例。接著會在 `Worker` 上實現一個方法，它會獲取需要允許代碼的閉包並將其發送給已經運行的執行緒執行。我們還會賦予每一個 worker `id`，這樣就可以在日誌和除錯中區別執行緒池中的不同 worker。

首先，讓我們做出如此創建 `ThreadPool` 時所需的修改。在透過如下方式設置完 `Worker` 之後，我們會實現向執行緒發送閉包的代碼：

1. 定義 `Worker` 結構體存放 `id` 和 `JoinHandle<()>`
2. 修改 `ThreadPool` 存放一個 `Worker` 實例的 vector
3. 定義 `Worker::new` 函數，它獲取一個 `id` 數字並返回一個帶有 `id` 和用空閉包分配的執行緒的 `Worker` 實例
4. 在 `ThreadPool::new` 中，使用 `for` 循環計數生成 `id`，使用這個 `id` 新建 `Worker`，並儲存進 vector 中

如果你渴望挑戰，在查範例 20-15 中的代碼之前嘗試自己實現這些修改。

準備好了嗎？範例 20-15 就是一個做出了這些修改的例子：

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
}

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool {
            workers
        }
    }
    // --snip--
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});

        Worker {
            id,
            thread,
        }
    }
}
```

<span class="caption">範例 20-15: 修改 `ThreadPool` 存放 `Worker` 實例而不是直接存放執行緒</span>

這裡將 `ThreadPool` 中欄位名從 `threads` 改為 `workers`，因為它現在儲存 `Worker` 而不是 `JoinHandle<()>`。使用 `for` 循環中的計數作為 `Worker::new` 的參數，並將每一個新建的 `Worker` 儲存在叫做 `workers` 的 vector 中。

`Worker` 結構體和其 `new` 函數是私有的，因為外部代碼（比如 *src/bin/main.rs* 中的 server）並不需要知道關於 `ThreadPool` 中使用 `Worker` 結構體的實現細節。`Worker::new` 函數使用 `id` 參數並儲存了使用一個空閉包創建的 `JoinHandle<()>`。

這段代碼能夠編譯並用指定給 `ThreadPool::new` 的參數創建儲存了一系列的 `Worker` 實例，不過 **仍然** 沒有處理 `execute` 中得到的閉包。讓我們聊聊接下來怎麼做。

#### 使用通道向執行緒發送請求

下一個需要解決的問題是傳遞給 `thread::spawn` 的閉包完全沒有做任何工作。目前，我們在 `execute` 方法中獲得期望執行的閉包，不過在創建 `ThreadPool` 的過程中創建每一個 `Worker` 時需要向 `thread::spawn` 傳遞一個閉包。

我們希望剛創建的 `Worker` 結構體能夠從 `ThreadPool` 的隊列中獲取需要執行的代碼，並發送到執行緒中執行他們。

在第十六章，我們學習了 **通道** —— 一個溝通兩個執行緒的簡單手段 —— 對於這個例子來說則是絕佳的。這裡通道將充當任務隊列的作用，`execute` 將通過 `ThreadPool` 向其中執行緒正在尋找工作的 `Worker` 實例發送任務。如下是這個計劃：

1. `ThreadPool` 會創建一個通道並充當發送端。
2. 每個 `Worker` 將會充當通道的接收端。
3. 新建一個 `Job` 結構體來存放用於向通道中發送的閉包。
4. `execute` 方法會在通道發送端發出期望執行的任務。
5. 在執行緒中，`Worker` 會遍歷通道的接收端並執行任何接收到的任務。

讓我們以在 `ThreadPool::new` 中創建通道並讓 `ThreadPool` 實例充當發送端開始，如範例 20-16 所示。`Job` 是將在通道中發出的類型，目前它是一個沒有任何內容的結構體：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# use std::thread;
// --snip--
use std::sync::mpsc;

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool {
            workers,
            sender,
        }
    }
    // --snip--
}
#
# struct Worker {
#     id: usize,
#     thread: thread::JoinHandle<()>,
# }
#
# impl Worker {
#     fn new(id: usize) -> Worker {
#         let thread = thread::spawn(|| {});
#
#         Worker {
#             id,
#             thread,
#         }
#     }
# }
```

<span class="caption">範例 20-16: 修改 `ThreadPool` 來儲存一個發送 `Job` 實例的通道發送端</span>

在 `ThreadPool::new` 中，新建了一個通道，並接著讓執行緒池在接收端等待。這段代碼能夠編譯，不過仍有警告。

讓我們嘗試在執行緒池創建每個 worker 時將通道的接收端傳遞給他們。須知我們希望在 worker 所分配的執行緒中使用通道的接收端，所以將在閉包中引用 `receiver` 參數。範例 20-17 中展示的代碼還不能編譯：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
impl ThreadPool {
    // --snip--
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, receiver));
        }

        ThreadPool {
            workers,
            sender,
        }
    }
    // --snip--
}

// --snip--

impl Worker {
    fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker {
            id,
            thread,
        }
    }
}
```

<span class="caption">範例 20-17: 將通道的接收端傳遞給 worker</span>

這是一些小而直觀的修改：將通道的接收端傳遞進了 `Worker::new`，並接著在閉包中使用它。

如果嘗試 check 代碼，會得到這個錯誤：

```text
$ cargo check
   Compiling hello v0.1.0 (file:///projects/hello)
error[E0382]: use of moved value: `receiver`
  --> src/lib.rs:27:42
   |
27 |             workers.push(Worker::new(id, receiver));
   |                                          ^^^^^^^^ value moved here in
   previous iteration of loop
   |
   = note: move occurs because `receiver` has type
   `std::sync::mpsc::Receiver<Job>`, which does not implement the `Copy` trait
```

這段代碼嘗試將 `receiver` 傳遞給多個 `Worker` 實例。這是不行的，回憶第十六章：Rust 所提供的通道實現是多 **生產者**，單 **消費者** 的。這意味著不能簡單的複製通道的消費端來解決問題。即便可以，那也不是我們希望使用的技術；我們希望通過在所有的 worker 中共享單一 `receiver`，在執行緒間分發任務。

另外，從通道隊列中取出任務涉及到修改 `receiver`，所以這些執行緒需要一個能安全的共享和修改 `receiver` 的方式，否則可能導致競爭狀態（參考第十六章）。

回憶一下第十六章討論的執行緒安全智慧指針，為了在多個執行緒間共享所有權並允許執行緒修改其值，需要使用 `Arc<Mutex<T>>`。`Arc` 使得多個 worker 擁有接收端，而 `Mutex` 則確保一次只有一個 worker 能從接收端得到任務。範例 20-18 展示了所需的修改：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# use std::thread;
# use std::sync::mpsc;
use std::sync::Arc;
use std::sync::Mutex;
// --snip--

# pub struct ThreadPool {
#     workers: Vec<Worker>,
#     sender: mpsc::Sender<Job>,
# }
# struct Job;
#
impl ThreadPool {
    // --snip--
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

    // --snip--
}

# struct Worker {
#     id: usize,
#     thread: thread::JoinHandle<()>,
# }
#
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        // --snip--
#         let thread = thread::spawn(|| {
#            receiver;
#         });
#
#         Worker {
#             id,
#             thread,
#         }
    }
}
```

<span class="caption">範例 20-18: 使用 `Arc` 和 `Mutex` 在 worker 間共享通道的接收端</span>

在 `ThreadPool::new` 中，將通道的接收端放入一個 `Arc` 和一個 `Mutex` 中。對於每一個新 worker，複製 `Arc` 來增加引用計數，如此這些 worker 就可以共享接收端的所有權了。

通過這些修改，代碼可以編譯了！我們做到了！

#### 實現 `execute` 方法

最後讓我們實現 `ThreadPool` 上的 `execute` 方法。同時也要修改 `Job` 結構體：它將不再是結構體，`Job` 將是一個有著 `execute` 接收到的閉包類型的 trait 對象的類型別名。第十九章 [“類型別名用來創建類型同義詞”][creating-type-synonyms-with-type-aliases] 部分提到過，類型別名允許將長的類型變短。觀察範例 20-19：

<span class="filename">檔案名: src/lib.rs</span>

```rust
// --snip--
# pub struct ThreadPool {
#     workers: Vec<Worker>,
#     sender: mpsc::Sender<Job>,
# }
# use std::sync::mpsc;
# struct Worker {}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    // --snip--

    pub fn execute<F>(&self, f: F)
        where
            F: FnOnce() + Send + 'static
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

// --snip--
```

<span class="caption">範例 20-19: 為存放每一個閉包的 `Box` 創建一個 `Job` 類型別名，接著在通道中發出任務</span>

在使用 `execute` 得到的閉包新建 `Job` 實例之後，將這些任務從通道的發送端發出。這裡調用 `send` 上的 `unwrap`，因為發送可能會失敗，這可能發生於例如停止了所有執行緒執行的情況，這意味著接收端停止接收新消息了。不過目前我們無法停止執行緒執行；只要執行緒池存在他們就會一直執行。使用 `unwrap` 是因為我們知道失敗不可能發生，即便編譯器不這麼認為。

不過到此事情還沒有結束！在 worker 中，傳遞給 `thread::spawn` 的閉包仍然還只是 **引用** 了通道的接收端。相反我們需要閉包一直循環，向通道的接收端請求任務，並在得到任務時執行他們。如範例 20-20 對 `Worker::new` 做出修改：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let job = receiver.lock().unwrap().recv().unwrap();

                println!("Worker {} got a job; executing.", id);

                job();
            }
        });

        Worker {
            id,
            thread,
        }
    }
}
```

<span class="caption">範例 20-20: 在 worker 執行緒中接收並執行任務</span>

這裡，首先在 `receiver` 上調用了 `lock` 來獲取互斥器，接著 `unwrap` 在出現任何錯誤時 panic。如果互斥器處於一種叫做 **被汙染**（*poisoned*）的狀態時獲取鎖可能會失敗，這可能發生於其他執行緒在持有鎖時 panic 了且沒有釋放鎖。在這種情況下，調用 `unwrap` 使其 panic 是正確的行為。請隨意將 `unwrap` 改為包含有意義錯誤訊息的 `expect`。

如果鎖定了互斥器，接著調用 `recv` 從通道中接收 `Job`。最後的 `unwrap` 也繞過了一些錯誤，這可能發生於持有通道發送端的執行緒停止的情況，類似於如果接收端關閉時 `send` 方法如何返回 `Err` 一樣。

調用 `recv` 會阻塞當前執行緒，所以如果還沒有任務，其會等待直到有可用的任務。`Mutex<T>` 確保一次只有一個 `Worker` 執行緒嘗試請求任務。

透過這個技巧，執行緒池處於可以運行的狀態了！執行 `cargo run` 並發起一些請求：

```text
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
warning: field is never used: `workers`
 --> src/lib.rs:7:5
  |
7 |     workers: Vec<Worker>,
  |     ^^^^^^^^^^^^^^^^^^^^
  |
  = note: #[warn(dead_code)] on by default

warning: field is never used: `id`
  --> src/lib.rs:61:5
   |
61 |     id: usize,
   |     ^^^^^^^^^
   |
   = note: #[warn(dead_code)] on by default

warning: field is never used: `thread`
  --> src/lib.rs:62:5
   |
62 |     thread: thread::JoinHandle<()>,
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: #[warn(dead_code)] on by default

    Finished dev [unoptimized + debuginfo] target(s) in 0.99 secs
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
```

成功了！現在我們有了一個可以非同步執行連接的執行緒池！它絕不會創建超過四個執行緒，所以當 server 收到大量請求時系統也不會負擔過重。如果請求 */sleep*，server 也能夠通過另外一個執行緒處理其他請求。

> 注意如果同時在多個瀏覽器窗口打開 */sleep*，它們可能會彼此間隔地載入 5 秒，因為一些瀏覽器處於快取的原因會順序執行相同請求的多個實例。這些限制並不是由於我們的 web server 造成的。

在學習了第十八章的 `while let` 循環之後，你可能會好奇為何不能如此編寫 worker 執行緒，如範例 20-21 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,not_desired_behavior
// --snip--

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            while let Ok(job) = receiver.lock().unwrap().recv() {
                println!("Worker {} got a job; executing.", id);

                job();
            }
        });

        Worker {
            id,
            thread,
        }
    }
}
```

<span class="caption">範例 20-21: 一個使用 `while let` 的 `Worker::new` 替代實現</span>

這段代碼可以編譯和運行，但是並不會產生所期望的執行緒行為：一個慢請求仍然會導致其他請求等待執行。其原因有些微妙：`Mutex` 結構體沒有公有 `unlock` 方法，因為鎖的所有權依賴 `lock` 方法返回的 `LockResult<MutexGuard<T>>` 中 `MutexGuard<T>` 的生命週期。這允許借用檢查器在編譯時確保絕不會在沒有持有鎖的情況下訪問由 `Mutex` 守護的資源，不過如果沒有認真的思考 `MutexGuard<T>` 的生命週期的話，也可能會導致比預期更久的持有鎖。因為 `while` 表達式中的值在整個塊一直處於作用域中，`job()` 調用的過程中其仍然持有鎖，這意味著其他 worker 不能接收任務。

相反透過使用 `loop` 並在循環塊之內而不是之外獲取鎖和任務，`lock` 方法返回的 `MutexGuard` 在 `let job` 語句結束之後立刻就被丟棄了。這確保了 `recv` 調用過程中持有鎖，而在 `job()` 調用前鎖就被釋放了，這就允許並發處理多個請求了。

[creating-type-synonyms-with-type-aliases]:
ch19-04-advanced-types.html#creating-type-synonyms-with-type-aliases
[integer-types]: ch03-02-data-types.html#integer-types
[storing-closures-using-generic-parameters-and-the-fn-traits]:
ch13-01-closures.html#storing-closures-using-generic-parameters-and-the-fn-traits

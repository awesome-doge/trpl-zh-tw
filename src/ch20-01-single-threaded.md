## 構建單執行緒 web server

> [ch20-01-single-threaded.md](https://github.com/rust-lang/book/blob/master/src/ch20-01-single-threaded.md)
> <br>
> commit f617d58c1a88dd2912739a041fd4725d127bf9fb

首先讓我們創建一個可運行的單執行緒 web server，不過在開始之前，我們將快速了解一下構建 web server 所涉及到的協議。這些協議的細節超出了本書的範疇，不過一個簡單的概括會提供我們所需的訊息。

web server 中涉及到的兩個主要協議是 **超文本傳輸協定**（*Hypertext Transfer Protocol*，*HTTP*）和 **傳輸控制協議**（*Transmission Control Protocol*，*TCP*）。這兩者都是 **請求-響應**（*request-response*）協議，也就是說，有 **用戶端**（*client*）來初始化請求，並有 **服務端**（*server*）監聽請求並向用戶端提供響應。請求與響應的內容由協議本身定義。

TCP 是一個底層協議，它描述了訊息如何從一個 server 到另一個的細節，不過其並不指定訊息是什麼。HTTP 構建於 TCP 之上，它定義了請求和響應的內容。為此，技術上講可將 HTTP 用於其他協議之上，不過對於絕大部分情況，HTTP 通過 TCP 傳輸。我們將要做的就是處理 TCP 和 HTTP 請求與響應的原始位元組數據。

### 監聽 TCP 連接

所以我們的 web server 所需做的第一件事便是能夠監聽 TCP 連接。標準庫提供了 `std::net` 模組處理這些功能。讓我們一如既往新建一個項目：

```text
$ cargo new hello
     Created binary (application) `hello` project
$ cd hello
```

並在 `src/main.rs` 輸入範例 20-1 中的代碼作為開始。這段代碼會在地址 `127.0.0.1:7878` 上監聽傳入的 TCP 流。當獲取到傳入的流，它會列印出 `Connection established!`：

<span class="filename">檔案名: src/main.rs</span>

```rust,no_run
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        println!("Connection established!");
    }
}
```

<span class="caption">範例 20-1: 監聽傳入的流並在接收到流時列印訊息</span>

`TcpListener` 用於監聽 TCP 連接。我們選擇監聽地址 `127.0.0.1:7878`。將這個地址拆開，冒號之前的部分是一個代表本機的 IP 地址（這個地址在每台計算機上都相同，並不特指作者的計算機），而 `7878` 是埠。選擇這個埠出於兩個原因：通常 HTTP 接受這個埠而且 7878 在電話上打出來就是 "rust"（譯者註：九宮格鍵盤上的英文）。

在這個場景中 `bind` 函數類似於 `new` 函數，在這裡它返回一個新的 `TcpListener` 實例。這個函數叫做 `bind` 是因為，在網路領域，連接到監聽埠被稱為 “綁定到一個埠”（“binding to a port”）

`bind` 函數返回 `Result<T, E>`，這表明綁定可能會失敗，例如，連接 80 埠需要管理員權限（非管理員用戶只能監聽大於 1024 的埠），所以如果不是管理員嘗試連接 80 埠，則會綁定失敗。另一個例子是如果運行兩個此程序的實例這樣會有兩個程序監聽相同的埠，綁定會失敗。因為我們是出於學習目的來編寫一個基礎的 server，將不用關心處理這類錯誤，使用 `unwrap` 在出現這些情況時直接停止程式。

`TcpListener` 的 `incoming` 方法返回一個疊代器，它提供了一系列的流（更準確的說是 `TcpStream` 類型的流）。**流**（*stream*）代表一個用戶端和服務端之間打開的連接。**連接**（*connection*）代表用戶端連接服務端、服務端生成響應以及服務端關閉連接的全部請求 / 響應過程。為此，`TcpStream` 允許我們讀取它來查看用戶端發送了什麼，並可以編寫響應。總體來說，這個 `for` 循環會依次處理每個連接並產生一系列的流供我們處理。

目前為止，處理流的過程包含 `unwrap` 調用，如果出現任何錯誤會終止程式，如果沒有任何錯誤，則列印出訊息。下一個範例我們將為成功的情況增加更多功能。當用戶端連接到服務端時 `incoming` 方法返回錯誤是可能的，因為我們實際上沒有遍歷連接，而是遍歷 **連接嘗試**（*connection attempts*）。連接可能會因為很多原因不能成功，大部分是操作系統相關的。例如，很多系統限制同時打開的連接數；新連接嘗試產生錯誤，直到一些打開的連接關閉為止。

讓我們試試這段代碼！首先在終端執行 `cargo run`，接著在瀏覽器中載入 `127.0.0.1:7878`。瀏覽器會顯示出看起來類似於“連接重設”（“Connection reset”）的錯誤訊息，因為 server 目前並沒響應任何數據。但是如果我們觀察終端，會發現當瀏覽器連接 server 時會列印出一系列的訊息！

```text
     Running `target/debug/hello`
Connection established!
Connection established!
Connection established!
```

有時會看到對於一次瀏覽器請求會列印出多條訊息；這可能是因為瀏覽器在請求頁面的同時還請求了其他資源，比如出現在瀏覽器 tab 標籤中的 *favicon.ico*。

這也可能是因為瀏覽器嘗試多次連接 server，因為 server 沒有響應任何數據。當 `stream` 在循環的結尾離開作用域並被丟棄，其連接將被關閉，作為 `drop` 實現的一部分。瀏覽器有時透過重連來處理關閉的連接，因為這些問題可能是暫時的。現在重要的是我們成功的處理了 TCP 連接！

記得當運行完特定版本的代碼後使用 <span class="keystroke">ctrl-C</span> 來停止程式。並在做出最新的代碼修改之後執行 `cargo run` 重啟服務。

### 讀取請求

讓我們實現讀取來自瀏覽器請求的功能！為了分離獲取連接和接下來對連接的操作的相關內容，我們將開始一個新函數來處理連接。在這個新的 `handle_connection` 函數中，我們從 TCP 流中讀取數據並列印出來以便觀察瀏覽器發送過來的數據。將代碼修改為如範例 20-2 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,no_run
use std::io::prelude::*;
use std::net::TcpStream;
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];

    stream.read(&mut buffer).unwrap();

    println!("Request: {}", String::from_utf8_lossy(&buffer[..]));
}
```

<span class="caption">範例 20-2: 讀取 `TcpStream` 並列印數據</span>

這裡將 `std::io::prelude` 引入作用域來獲取讀寫流所需的特定 trait。在 `main` 函數的 `for` 循環中，相比獲取到連接時列印訊息，現在調用新的 `handle_connection` 函數並向其傳遞 `stream`。

在 `handle_connection` 中，`stream` 參數是可變的。這是因為 `TcpStream` 實例在內部記錄了所返回的數據。它可能讀取了多於我們請求的數據並保存它們以備下一次請求數據。因此它需要是 `mut` 的因為其內部狀態可能會改變；通常我們認為 “讀取” 不需要可變性，不過在這個例子中則需要 `mut` 關鍵字。

接下來，需要實際讀取流。這裡分兩步進行：首先，在棧上聲明一個 `buffer` 來存放讀取到的數據。這裡創建了一個 1024 位元組的緩衝區，它足以存放基本請求的數據並滿足本章的目的需要。如果希望處理任意大小的請求，緩衝區管理將更為複雜，不過現在一切從簡。接著將緩衝區傳遞給 `stream.read` ，它會從 `TcpStream` 中讀取位元組並放入緩衝區中。

接下來將緩衝區中的位元組轉換為字串並列印出來。`String::from_utf8_lossy` 函數獲取一個 `&[u8]` 並產生一個 `String`。函數名的 “lossy” 部分來源於當其遇到無效的 UTF-8 序列時的行為：它使用 `�`，`U+FFFD REPLACEMENT CHARACTER`，來代替無效序列。你可能會在緩衝區的剩餘部分看到這些替代字元，因為他們沒有被請求數據填滿。

讓我們試一試！啟動程序並再次在瀏覽器中發起請求。注意瀏覽器中仍然會出現錯誤頁面，不過終端中程序的輸出現在看起來像這樣：

```text
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished dev [unoptimized + debuginfo] target(s) in 0.42 secs
     Running `target/debug/hello`
Request: GET / HTTP/1.1
Host: 127.0.0.1:7878
User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101
Firefox/52.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: keep-alive
Upgrade-Insecure-Requests: 1
������������������������������������
```

根據使用的瀏覽器不同可能會出現稍微不同的數據。現在我們列印出了請求數據，可以通過觀察 `Request: GET` 之後的路徑來解釋為何會從瀏覽器得到多個連接。如果重複的連接都是請求 */*，就知道了瀏覽器嘗試重複獲取 */* 因為它沒有從程序得到響應。

拆開請求數據來理解瀏覽器向程序請求了什麼。

#### 仔細觀察 HTTP 請求

HTTP 是一個基於文本的協議，同時一個請求有如下格式：

```text
Method Request-URI HTTP-Version CRLF
headers CRLF
message-body
```

第一行叫做 **請求行**（*request line*），它存放了用戶端請求了什麼的訊息。請求行的第一部分是所使用的 *method*，比如 `GET` 或 `POST`，這描述了用戶端如何進行請求。這裡用戶端使用了 `GET` 請求。

請求行接下來的部分是 */*，它代表用戶端請求的 **統一資源標識符**（*Uniform Resource Identifier*，*URI*） —— URI 大體上類似，但也不完全類似於 URL（**統一資源定位符**，*Uniform Resource Locators*）。URI 和 URL 之間的區別對於本章的目的來說並不重要，不過 HTTP 規範使用術語 URI，所以這裡可以簡單的將 URL 理解為 URI。

最後一部分是用戶端使用的HTTP版本，然後請求行以 **CRLF序列** （CRLF代表回車和換行，*carriage return line feed*，這是打字機時代的術語！）結束。CRLF序列也可以寫成`\r\n`，其中`\r`是回車符，`\n`是換行符。 CRLF序列將請求行與其餘請求數據分開。 請注意，列印CRLF時，我們會看到一個新行，而不是`\r\n`。

觀察目前運行程序所接收到的數據的請求行，可以看到 `GET` 是 method，*/* 是請求 URI，而 `HTTP/1.1` 是版本。

從 `Host:` 開始的其餘的行是 headers；`GET` 請求沒有 body。

如果你希望的話，嘗試用不同的瀏覽器發送請求，或請求不同的地址，比如 `127.0.0.1:7878/test`，來觀察請求數據如何變化。

現在我們知道了瀏覽器請求了什麼。讓我們返回一些數據！

### 編寫響應

我們將實現在用戶端請求的響應中發送數據的功能。響應有如下格式：

```text
HTTP-Version Status-Code Reason-Phrase CRLF
headers CRLF
message-body
```

第一行叫做 **狀態行**（*status line*），它包含響應的 HTTP 版本、一個數字狀態碼用以總結請求的結果和一個描述之前狀態碼的文本原因短語。CRLF 序列之後是任意 header，另一個 CRLF 序列，和響應的 body。

這裡是一個使用 HTTP 1.1 版本的響應例子，其狀態碼為 200，原因短語為 OK，沒有 header，也沒有 body：

```text
HTTP/1.1 200 OK\r\n\r\n
```

狀態碼 200 是一個標準的成功響應。這些文本是一個微型的成功 HTTP 響應。讓我們將這些文本寫入流作為成功請求的響應！在 `handle_connection` 函數中，我們需要去掉列印請求數據的 `println!`，並替換為範例 20-3 中的代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::io::prelude::*;
# use std::net::TcpStream;
fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];

    stream.read(&mut buffer).unwrap();

    let response = "HTTP/1.1 200 OK\r\n\r\n";

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
```

<span class="caption">範例 20-3: 將一個微型成功 HTTP 響應寫入流</span>

新代碼中的第一行定義了變數 `response` 來存放將要返回的成功響應的數據。接著，在 `response` 上調用 `as_bytes`，因為 `stream` 的 `write` 方法獲取一個 `&[u8]` 並直接將這些位元組發送給連接。

因為 `write` 操作可能會失敗，所以像之前那樣對任何錯誤結果使用 `unwrap`。同理，在真實世界的應用中這裡需要添加錯誤處理。最後，`flush` 會等待並阻塞程序執行直到所有位元組都被寫入連接中；`TcpStream` 包含一個內部緩衝區來最小化對底層操作系統的調用。

有了這些修改，運行我們的代碼並進行請求！我們不再向終端列印任何數據，所以不會再看到除了 Cargo 以外的任何輸出。不過當在瀏覽器中載入 *127.0.0.1:7878* 時，會得到一個空頁面而不是錯誤。太棒了！我們剛剛手寫了一個 HTTP 請求與響應。

### 返回真正的 HTML

讓我們實現不只是返回空頁面的功能。在項目根目錄創建一個新文件，*hello.html* —— 也就是說，不是在 `src` 目錄。在此可以放入任何你期望的 HTML；列表 20-4 展示了一個可能的文本：

<span class="filename">檔案名: hello.html</span>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

<span class="caption">範例 20-4: 一個簡單的 HTML 文件用來作為響應</span>

這是一個極小化的 HTML5 文件，它有一個標題和一小段文本。為了在 server 接受請求時返回它，需要如範例 20-5 所示修改 `handle_connection` 來讀取 HTML 文件，將其加入到響應的 body 中，並發送：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::io::prelude::*;
# use std::net::TcpStream;
use std::fs;
// --snip--

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    let contents = fs::read_to_string("hello.html").unwrap();

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
        contents.len(),
        contents
    );

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
```

<span class="caption">範例 20-5: 將 *hello.html* 的內容作為響應 body 發送</span>

在開頭增加了一行來將標準庫中的 `File` 引入作用域。打開和讀取文件的代碼應該看起來很熟悉，因為第十二章 I/O 項目的範例 12-4 中讀取文件內容時出現過類似的代碼。

接下來，使用 `format!` 將文件內容加入到將要寫入流的成功響應的 body 中。

使用 `cargo run` 運行程序，在瀏覽器載入 *127.0.0.1:7878*，你應該會看到渲染出來的 HTML 文件！

目前忽略了 `buffer` 中的請求數據並無條件的發送了 HTML 文件的內容。這意味著如果嘗試在瀏覽器中請求 *127.0.0.1:7878/something-else* 也會得到同樣的 HTML 響應。如此其作用是非常有限的，也不是大部分 server 所做的；讓我們檢查請求並只對格式良好（well-formed）的請求 `/` 發送 HTML 文件。

### 驗證請求並有選擇的進行響應

目前我們的 web server 不管用戶端請求什麼都會返回相同的 HTML 文件。讓我們增加在返回 HTML 文件前檢查瀏覽器是否請求 */*，並在其請求任何其他內容時返回錯誤的功能。為此需要如範例 20-6 那樣修改 `handle_connection`。新代碼接收到的請求的內容與已知的 */* 請求的一部分做比較，並增加了 `if` 和 `else` 塊來區別處理請求：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::io::prelude::*;
# use std::net::TcpStream;
# use std::fs;
// --snip--

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    let get = b"GET / HTTP/1.1\r\n";

    if buffer.starts_with(get) {
        let contents = fs::read_to_string("hello.html").unwrap();

        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
            contents.len(),
            contents
        );

        stream.write(response.as_bytes()).unwrap();
        stream.flush().unwrap();
    } else {
        // 其他請求
    }
}
```

<span class="caption">範例 20-6: 匹配請求並區別處理 */* 請求與其他請求</span>

首先，將與 */* 請求相關的數據寫死進變數 `get`。因為我們將原始位元組讀取進了緩衝區，所以在 `get` 的數據開頭增加 `b""` 位元組字串語法將其轉換為位元組字串。接著檢查 `buffer` 是否以 `get` 中的位元組開頭。如果是，這就是一個格式良好的 */* 請求，也就是 `if` 塊中期望處理的成功情況，並會返回 HTML 文件內容的代碼。

如果 `buffer` **不** 以 `get` 中的位元組開頭，就說明接收的是其他請求。之後會在  `else` 塊中增加代碼來響應所有其他請求。

現在如果運行程式碼並請求 *127.0.0.1:7878*，就會得到 *hello.html* 中的 HTML。如果進行任何其他請求，比如 *127.0.0.1:7878/something-else*，則會得到像運行範例 20-1 和 20-2 中代碼那樣的連接錯誤。

現在向範例 20-7 的 `else` 塊增加代碼來返回一個帶有 404 狀態碼的響應，這代表了所請求的內容沒有找到。接著也會返回一個 HTML 向瀏覽器終端用戶表明此意：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::io::prelude::*;
# use std::net::TcpStream;
# use std::fs;
# fn handle_connection(mut stream: TcpStream) {
# if true {
// --snip--

} else {
    let status_line = "HTTP/1.1 404 NOT FOUND\r\n\r\n";
    let contents = fs::read_to_string("404.html").unwrap();

    let response = format!("{}{}", status_line, contents);

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
# }
```

<span class="caption">範例 20-7: 對於任何不是 */* 的請求返回 `404` 狀態碼的響應和錯誤頁面</span>

這裡，響應的狀態行有狀態碼 404 和原因短語 `NOT FOUND`。仍然沒有返回任何 header，而其 body 將是 *404.html* 文件中的 HTML。需要在 *hello.html* 同級目錄創建 *404.html* 文件作為錯誤頁面；這一次也可以隨意使用任何 HTML 或使用範例 20-8 中的範例 HTML：

<span class="filename">檔案名: 404.html</span>

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Oops!</h1>
    <p>Sorry, I don't know what you're asking for.</p>
  </body>
</html>
```

<span class="caption">範例 20-8: 任何 404 響應所返回錯誤頁面內容樣例</span>

有了這些修改，再次運行 server。請求 *127.0.0.1:7878* 應該會返回 *hello.html* 的內容，而對於任何其他請求，比如 *127.0.0.1:7878/foo*，應該會返回 *404.html* 中的錯誤 HTML！

### 少量代碼重構

目前 `if` 和 `else` 塊中的代碼有很多的重複：他們都讀取文件並將其內容寫入流。唯一的區別是狀態行和檔案名。為了使代碼更為簡明，將這些區別分別提取到一行 `if` 和 `else` 中，對狀態行和檔案名變數賦值；然後在讀取文件和寫入響應的代碼中無條件的使用這些變數。重構後取代了大段 `if` 和 `else` 塊代碼後的結果如範例 20-9 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::io::prelude::*;
# use std::net::TcpStream;
# use std::fs;
// --snip--

fn handle_connection(mut stream: TcpStream) {
#     let mut buffer = [0; 1024];
#     stream.read(&mut buffer).unwrap();
#
#     let get = b"GET / HTTP/1.1\r\n";
    // --snip--

    let (status_line, filename) = if buffer.starts_with(get) {
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

<span class="caption">範例 20-9: 重構使得 `if` 和 `else` 塊中只包含兩個情況所不同的代碼</span>

現在 `if` 和 `else` 塊所做的唯一的事就是在一個元組中返回合適的狀態行和檔案名的值；接著使用第十八章講到的使用模式的 `let` 語句通過解構元組的兩部分為 `filename` 和 `header` 賦值。

之前讀取文件和寫入響應的冗餘代碼現在位於 `if` 和 `else` 塊之外，並會使用變數 `status_line` 和 `filename`。這樣更易於觀察這兩種情況真正有何不同，還意味著如果需要改變如何讀取文件或寫入響應時只需要更新一處的代碼。範例 20-9 中代碼的行為與範例 20-8 完全一樣。

好極了！我們有了一個 40 行左右 Rust 代碼的小而簡單的 server，它對一個請求返回頁面內容而對所有其他請求返回 404 響應。

目前 server 運行於單執行緒中，它一次只能處理一個請求。讓我們模擬一些慢請求來看看這如何會成為一個問題，並進行修復以便 server 可以一次處理多個請求。

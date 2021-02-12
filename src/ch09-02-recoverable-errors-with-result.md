## `Result` 與可恢復的錯誤

> [ch09-02-recoverable-errors-with-result.md](https://github.com/rust-lang/book/blob/master/src/ch09-02-recoverable-errors-with-result.md)
> <br>
> commit aa339f78da31c330ede3f1b52b4bbfb62d7814cb

大部分錯誤並沒有嚴重到需要程序完全停止執行。有時，一個函數會因為一個容易理解並做出反應的原因失敗。例如，如果因為打開一個並不存在的文件而失敗，此時我們可能想要創建這個文件，而不是終止進程。

回憶一下第二章 [“使用 `Result` 類型來處理潛在的錯誤”][handle_failure] 部分中的那個 `Result` 枚舉，它定義有如下兩個成員，`Ok` 和 `Err`：

[handle_failure]: ch02-00-guessing-game-tutorial.html#handling-potential-failure-with-the-result-type

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T` 和 `E` 是泛型類型參數；第十章會詳細介紹泛型。現在你需要知道的就是 `T` 代表成功時返回的 `Ok` 成員中的數據的類型，而 `E` 代表失敗時返回的 `Err` 成員中的錯誤的類型。因為 `Result` 有這些泛型類型參數，我們可以將 `Result` 類型和標準庫中為其定義的函數用於很多不同的場景，這些情況中需要返回的成功值和失敗值可能會各不相同。

讓我們調用一個返回 `Result` 的函數，因為它可能會失敗：如範例 9-3 所示打開一個文件：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
}
```

<span class="caption">範例 9-3：打開文件</span>

如何知道 `File::open` 返回一個 `Result` 呢？我們可以查看 [標準庫 API 文件](https://doc.rust-lang.org/std/index.html)<!-- ignore -->，或者可以直接問編譯器！如果給 `f` 某個我們知道 **不是** 函數返回值類型的類型註解，接著嘗試編譯代碼，編譯器會告訴我們類型不匹配。然後錯誤訊息會告訴我們 `f` 的類型 **應該** 是什麼。讓我們試試！我們知道 `File::open` 的返回值不是 `u32` 類型的，所以將 `let f` 語句改為如下：

```rust,ignore,does_not_compile
let f: u32 = File::open("hello.txt");
```

現在嘗試編譯會給出如下輸出：

```text
error[E0308]: mismatched types
 --> src/main.rs:4:18
  |
4 |     let f: u32 = File::open("hello.txt");
  |                  ^^^^^^^^^^^^^^^^^^^^^^^ expected u32, found enum
`std::result::Result`
  |
  = note: expected type `u32`
             found type `std::result::Result<std::fs::File, std::io::Error>`
```

這就告訴我們了 `File::open` 函數的返回值類型是 `Result<T, E>`。這裡泛型參數 `T` 放入了成功值的類型 `std::fs::File`，它是一個文件句柄。`E` 被用在失敗值上時 `E` 的類型是 `std::io::Error`。

這個返回值類型說明 `File::open` 調用可能會成功並返回一個可以進行讀寫的文件句柄。這個函數也可能會失敗：例如，文件可能並不存在，或者可能沒有訪問文件的權限。`File::open` 需要一個方式告訴我們是成功還是失敗，並同時提供給我們文件句柄或錯誤訊息。而這些訊息正是 `Result` 枚舉可以提供的。

當 `File::open` 成功的情況下，變數 `f` 的值將會是一個包含文件句柄的 `Ok` 實例。在失敗的情況下，`f` 的值會是一個包含更多關於出現了何種錯誤訊息的 `Err` 實例。

我們需要在範例 9-3 的代碼中增加根據 `File::open` 返回值進行不同處理的邏輯。範例 9-4 展示了一個使用基本工具處理 `Result` 的例子：第六章學習過的 `match` 表達式。

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Problem opening the file: {:?}", error)
        },
    };
}
```

<span class="caption">範例 9-4：使用 `match` 表達式處理可能會返回的 `Result` 成員</span>

注意與 `Option` 枚舉一樣，`Result` 枚舉和其成員也被導入到了 prelude 中，所以就不需要在 `match` 分支中的 `Ok` 和 `Err` 之前指定 `Result::`。

這裡我們告訴 Rust 當結果是 `Ok` 時，返回 `Ok` 成員中的 `file` 值，然後將這個文件句柄賦值給變數 `f`。`match` 之後，我們可以利用這個文件句柄來進行讀寫。

`match` 的另一個分支處理從 `File::open` 得到 `Err` 值的情況。在這種情況下，我們選擇調用 `panic!` 宏。如果當前目錄沒有一個叫做 *hello.txt* 的文件，當運行這段代碼時會看到如下來自 `panic!` 宏的輸出：

```text
thread 'main' panicked at 'Problem opening the file: Error { repr:
Os { code: 2, message: "No such file or directory" } }', src/main.rs:9:12
```

一如既往，此輸出準確地告訴了我們到底出了什麼錯。

### 匹配不同的錯誤

範例 9-4 中的代碼不管 `File::open` 是因為什麼原因失敗都會 `panic!`。我們真正希望的是對不同的錯誤原因採取不同的行為：如果 `File::open `因為文件不存在而失敗，我們希望創建這個文件並返回新文件的句柄。如果 `File::open` 因為任何其他原因失敗，例如沒有打開文件的權限，我們仍然希望像範例 9-4 那樣 `panic!`。讓我們看看範例 9-5，其中 `match` 增加了另一個分支：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => panic!("Problem opening the file: {:?}", other_error),
        },
    };
}
```

<span class="caption">範例 9-5：使用不同的方式處理不同類型的錯誤</span>

`File::open` 返回的 `Err` 成員中的值類型 `io::Error`，它是一個標準庫中提供的結構體。這個結構體有一個返回 `io::ErrorKind` 值的 `kind` 方法可供調用。`io::ErrorKind` 是一個標準庫提供的枚舉，它的成員對應 `io` 操作可能導致的不同錯誤類型。我們感興趣的成員是 `ErrorKind::NotFound`，它代表嘗試打開的文件並不存在。這樣，`match` 就匹配完 `f` 了，不過對於 `error.kind()` 還有一個內層 `match`。

我們希望在內層 `match` 中檢查的條件是 `error.kind()` 的返回值是否為 `ErrorKind`的 `NotFound` 成員。如果是，則嘗試通過 `File::create` 創建文件。然而因為 `File::create` 也可能會失敗，還需要增加一個內層 `match` 語句。當文件不能被打開，會列印出一個不同的錯誤訊息。外層 `match` 的最後一個分支保持不變，這樣對任何除了文件不存在的錯誤會使程序 panic。

這裡有好多 `match`！`match` 確實很強大，不過也非常的基礎。第十三章我們會介紹閉包（closure）。`Result<T, E>` 有很多接受閉包的方法，並採用 `match` 表達式實現。一個更老練的 Rustacean 可能會這麼寫：

```rust,ignore
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {:?}", error);
            })
        } else {
            panic!("Problem opening the file: {:?}", error);
        }
    });
}
```

雖然這段代碼有著如範例 9-5 一樣的行為，但並沒有包含任何 `match` 表達式且更容易閱讀。在閱讀完第十三章後再回到這個例子，並查看標準庫文件 `unwrap_or_else` 方法都做了什麼操作。在處理錯誤時，還有很多這類方法可以消除大量嵌套的 `match` 表達式。

### 失敗時 panic 的簡寫：`unwrap` 和 `expect`

`match` 能夠勝任它的工作，不過它可能有點冗長並且不總是能很好的表明其意圖。`Result<T, E>` 類型定義了很多輔助方法來處理各種情況。其中之一叫做 `unwrap`，它的實現就類似於範例 9-4 中的 `match` 語句。如果 `Result` 值是成員 `Ok`，`unwrap` 會返回 `Ok` 中的值。如果 `Result` 是成員 `Err`，`unwrap` 會為我們調用 `panic!`。這裡是一個實踐 `unwrap` 的例子：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

如果調用這段代碼時不存在 *hello.txt* 文件，我們將會看到一個 `unwrap` 調用 `panic!` 時提供的錯誤訊息：

```text
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: Error {
repr: Os { code: 2, message: "No such file or directory" } }',
src/libcore/result.rs:906:4
```

還有另一個類似於 `unwrap` 的方法它還允許我們選擇 `panic!` 的錯誤訊息：`expect`。使用 `expect` 而不是 `unwrap` 並提供一個好的錯誤訊息可以表明你的意圖並更易於追蹤 panic 的根源。`expect` 的語法看起來像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

`expect` 與 `unwrap` 的使用方式一樣：返回文件句柄或調用 `panic!` 宏。`expect` 用來調用 `panic!` 的錯誤訊息將會作為參數傳遞給 `expect` ，而不像`unwrap` 那樣使用默認的 `panic!` 訊息。它看起來像這樣：

```text
thread 'main' panicked at 'Failed to open hello.txt: Error { repr: Os { code:
2, message: "No such file or directory" } }', src/libcore/result.rs:906:4
```

因為這個錯誤訊息以我們指定的文本開始，`Failed to open hello.txt`，將會更容易找到代碼中的錯誤訊息來自何處。如果在多處使用 `unwrap`，則需要花更多的時間來分析到底是哪一個 `unwrap` 造成了 panic，因為所有的 `unwrap` 調用都列印相同的訊息。

### 傳播錯誤

當編寫一個其實現會調用一些可能會失敗的操作的函數時，除了在這個函數中處理錯誤外，還可以選擇讓調用者知道這個錯誤並決定該如何處理。這被稱為 **傳播**（*propagating*）錯誤，這樣能更好的控制代碼調用，因為比起你代碼所擁有的上下文，調用者可能擁有更多訊息或邏輯來決定應該如何處理錯誤。

例如，範例 9-6 展示了一個從文件中讀取使用者名稱的函數。如果文件不存在或不能讀取，這個函數會將這些錯誤返回給調用它的代碼：

<span class="filename">Filename: src/main.rs</span>

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

<span class="caption">範例 9-6：一個函數使用 `match` 將錯誤返回給代碼調用者</span>

首先讓我們看看函數的返回值：`Result<String, io::Error>`。這意味著函數返回一個 `Result<T, E>` 類型的值，其中泛型參數 `T` 的具體類型是 `String`，而 `E` 的具體類型是 `io::Error`。如果這個函數沒有出任何錯誤成功返回，函數的調用者會收到一個包含 `String` 的 `Ok` 值 —— 函數從文件中讀取到的使用者名稱。如果函數遇到任何錯誤，函數的調用者會收到一個 `Err` 值，它儲存了一個包含更多這個問題相關訊息的 `io::Error` 實例。這裡選擇 `io::Error` 作為函數的返回值是因為它正好是函數體中那兩個可能會失敗的操作的錯誤返回值：`File::open` 函數和 `read_to_string` 方法。

函數體以 `File::open` 函數開頭。接著使用 `match` 處理返回值 `Result`，類似於範例 9-4 中的 `match`，唯一的區別是當 `Err` 時不再調用 `panic!`，而是提早返回並將 `File::open` 返回的錯誤值作為函數的錯誤返回值傳遞給調用者。如果 `File::open` 成功了，我們將文件句柄儲存在變數 `f` 中並繼續。

接著我們在變數 `s` 中創建了一個新 `String` 並調用文件句柄 `f` 的 `read_to_string` 方法來將文件的內容讀取到 `s` 中。`read_to_string` 方法也返回一個 `Result` 因為它也可能會失敗：哪怕是 `File::open` 已經成功了。所以我們需要另一個 `match` 來處理這個 `Result`：如果 `read_to_string` 成功了，那麼這個函數就成功了，並返回文件中的使用者名稱，它現在位於被封裝進 `Ok` 的 `s` 中。如果`read_to_string` 失敗了，則像之前處理 `File::open` 的返回值的 `match` 那樣返回錯誤值。不過並不需要顯式的調用 `return`，因為這是函數的最後一個表達式。

調用這個函數的代碼最終會得到一個包含使用者名稱的 `Ok` 值，或者一個包含 `io::Error` 的 `Err` 值。我們無從得知調用者會如何處理這些值。例如，如果他們得到了一個 `Err` 值，他們可能會選擇 `panic!` 並使程序崩潰、使用一個預設的使用者名稱或者從文件之外的地方尋找使用者名稱。我們沒有足夠的訊息知曉調用者具體會如何嘗試，所以將所有的成功或失敗訊息向上傳播，讓他們選擇合適的處理方法。

這種傳播錯誤的模式在 Rust 是如此的常見，以至於 Rust 提供了 `?` 問號運算符來使其更易於處理。

### 傳播錯誤的簡寫：`?` 運算符

範例 9-7 展示了一個 `read_username_from_file` 的實現，它實現了與範例 9-6 中的代碼相同的功能，不過這個實現使用了 `?` 運算符：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

<span class="caption">範例 9-7：一個使用 `?` 運算符向調用者返回錯誤的函數</span>

`Result` 值之後的 `?` 被定義為與範例 9-6 中定義的處理 `Result` 值的 `match` 表達式有著完全相同的工作方式。如果 `Result` 的值是 `Ok`，這個表達式將會返回 `Ok` 中的值而程序將繼續執行。如果值是 `Err`，`Err` 中的值將作為整個函數的返回值，就好像使用了 `return` 關鍵字一樣，這樣錯誤值就被傳播給了調用者。

範例 9-6 中的 `match` 表達式與問號運算符所做的有一點不同：`?` 運算符所使用的錯誤值被傳遞給了 `from` 函數，它定義於標準庫的 `From` trait 中，其用來將錯誤從一種類型轉換為另一種類型。當 `?` 運算符調用 `from` 函數時，收到的錯誤類型被轉換為由當前函數返回類型所指定的錯誤類型。這在當函數返回單個錯誤類型來代表所有可能失敗的方式時很有用，即使其可能會因很多種原因失敗。只要每一個錯誤類型都實現了 `from` 函數來定義如何將自身轉換為返回的錯誤類型，`?` 運算符會自動處理這些轉換。

在範例 9-7 的上下文中，`File::open` 調用結尾的 `?` 將會把 `Ok` 中的值返回給變數 `f`。如果出現了錯誤，`?` 運算符會提早返回整個函數並將一些 `Err` 值傳播給調用者。同理也適用於 `read_to_string` 調用結尾的 `?`。

`?` 運算符消除了大量樣板代碼並使得函數的實現更簡單。我們甚至可以在 `?` 之後直接使用鏈式方法調用來進一步縮短代碼，如範例 9-8 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();

    File::open("hello.txt")?.read_to_string(&mut s)?;

    Ok(s)
}
```

<span class="caption">範例 9-8：問號運算符之後的鏈式方法調用</span>

在 `s` 中創建新的 `String` 被放到了函數開頭；這一部分沒有變化。我們對 `File::open("hello.txt")?` 的結果直接鏈式調用了 `read_to_string`，而不再創建變數 `f`。仍然需要 `read_to_string` 調用結尾的 `?`，而且當 `File::open` 和 `read_to_string` 都成功沒有失敗時返回包含使用者名稱 `s` 的 `Ok` 值。其功能再一次與範例 9-6 和範例 9-7 保持一致，不過這是一個與眾不同且更符合工程學(ergonomic)的寫法。

說到編寫這個函數的不同方法，甚至還有一個更短的寫法：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::io;
use std::fs;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

<span class="caption">範例 9-9: 使用 `fs::read_to_string`</span>

將文件讀取到一個字串是相當常見的操作，所以 Rust 提供了名為 `fs::read_to_string` 的函數，它會打開文件、新建一個 `String`、讀取文件的內容，並將內容放入 `String`，接著返回它。當然，這樣做就沒有展示所有這些錯誤處理的機會了，所以我們最初就選擇了艱苦的道路。

### `?` 運算符可被用於返回 `Result` 的函數

`?` 運算符可被用於返回值類型為 `Result` 的函數，因為他被定義為與範例 9-6 中的 `match` 表達式有著完全相同的工作方式。`match` 的 `return Err(e)` 部分要求返回值類型是 `Result`，所以函數的返回值必須是 `Result` 才能與這個 `return` 相相容。

讓我們看看在 `main` 函數中使用 `?` 運算符會發生什麼事，如果你還記得的話其返回值類型是`()`：

```rust,ignore,does_not_compile
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;
}
```

當編譯這些程式碼，會得到如下錯誤訊息：

```text
error[E0277]: the `?` operator can only be used in a function that returns
`Result` or `Option` (or another type that implements `std::ops::Try`)
 --> src/main.rs:4:13
  |
4 |     let f = File::open("hello.txt")?;
  |             ^^^^^^^^^^^^^^^^^^^^^^^^ cannot use the `?` operator in a
  function that returns `()`
  |
  = help: the trait `std::ops::Try` is not implemented for `()`
  = note: required by `std::ops::Try::from_error`
```

錯誤指出只能在返回 `Result` 或者其它實現了 `std::ops::Try` 的類型的函數中使用 `?` 運算符。當你期望在不返回 `Result` 的函數中調用其他返回 `Result` 的函數時使用 `?` 的話，有兩種方法修復這個問題。一種技巧是將函數返回值類型修改為 `Result<T, E>`，如果沒有其它限制阻止你這麼做的話。另一種技巧是透過合適的方法使用 `match` 或 `Result` 的方法之一來處理 `Result<T, E>`。

`main` 函數是特殊的，其必須返回什麼類型是有限制的。`main` 函數的一個有效的返回值是 `()`，同時出於方便，另一個有效的返回值是 `Result<T, E>`，如下所示：

```rust,ignore
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;

    Ok(())
}
```

`Box<dyn Error>` 被稱為 “trait 對象”（“trait object”），第十七章 [“為使用不同類型的值而設計的 trait 對象”][trait-objects] 部分會做介紹。目前可以理解 `Box<dyn Error>` 為使用 `?` 時 `main` 允許返回的 “任何類型的錯誤”。

現在我們討論過了調用 `panic!` 或返回 `Result` 的細節，是時候回到他們各自適合哪些場景的話題了。

[trait-objects]: ch17-02-trait-objects.html#using-trait-objects-that-allow-for-values-of-different-types

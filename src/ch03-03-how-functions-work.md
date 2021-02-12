## 函數

> [ch03-03-how-functions-work.md](https://github.com/rust-lang/book/blob/master/src/ch03-03-how-functions-work.md)
> <br>
> commit 669a909a199bc20b913703c6618741d8b6ce1552

函數遍布於 Rust 代碼中。你已經見過語言中最重要的函數之一：`main` 函數，它是很多程序的入口點。你也見過 `fn` 關鍵字，它用來聲明新函數。

Rust 代碼中的函數和變數名使用 *snake case* 規範風格。在 snake case 中，所有字母都是小寫並使用下劃線分隔單詞。這是一個包含函數定義範例的程序：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    println!("Hello, world!");

    another_function();
}

fn another_function() {
    println!("Another function.");
}
```

Rust 中的函數定義以 `fn` 開始並在函數名後跟一對圓括號。大括號告訴編譯器哪裡是函數體的開始和結尾。

可以使用函數名後跟圓括號來調用我們定義過的任意函數。因為程序中已定義 `another_function` 函數，所以可以在 `main` 函數中調用它。注意，原始碼中 `another_function` 定義在 `main` 函數 **之後**；也可以定義在之前。Rust 不關心函數定義於何處，只要定義了就行。

讓我們新建一個叫做 *functions* 的二進位制項目來進一步探索函數。將上面的 `another_function` 例子寫入 *src/main.rs* 中並運行。你應該會看到如下輸出：

```text
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.28 secs
     Running `target/debug/functions`
Hello, world!
Another function.
```

`main` 函數中的代碼會按順序執行。首先，列印 “Hello, world!” 訊息，然後調用 `another_function` 函數並列印它的訊息。

### 函數參數

函數也可以被定義為擁有 **參數**（*parameters*），參數是特殊變數，是函數簽名的一部分。當函數擁有參數（形參）時，可以為這些參數提供具體的值（實參）。技術上講，這些具體值被稱為參數（*arguments*），但是在日常交流中，人們傾向於不區分使用 *parameter* 和 *argument* 來表示函數定義中的變數或調用函數時傳入的具體值。

下面被重寫的 `another_function` 版本展示了 Rust 中參數是什麼樣的：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    another_function(5);
}

fn another_function(x: i32) {
    println!("The value of x is: {}", x);
}
```

嘗試運行程序，將會輸出如下內容：

```text
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 1.21 secs
     Running `target/debug/functions`
The value of x is: 5
```

`another_function` 的聲明中有一個命名為 `x` 的參數。`x` 的類型被指定為 `i32`。當將 `5` 傳給 `another_function` 時，`println!` 宏將 `5` 放入格式化字串中大括號的位置。

在函數簽名中，**必須** 聲明每個參數的類型。這是 Rust 設計中一個經過慎重考慮的決定：要求在函數定義中提供類型註解，意味著編譯器不需要你在代碼的其他地方註明類型來指出你的意圖。

當一個函數有多個參數時，使用逗號分隔，像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    another_function(5, 6);
}

fn another_function(x: i32, y: i32) {
    println!("The value of x is: {}", x);
    println!("The value of y is: {}", y);
}
```

這個例子創建了有兩個參數的函數，都是 `i32` 類型。函數列印出了這兩個參數的值。注意函數的參數類型並不一定相同，這個例子中只是碰巧相同罷了。

嘗試運行程式碼。使用上面的例子替換當前 *functions* 項目的 *src/main.rs* 文件，並用 `cargo run` 運行它：

```text
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/functions`
The value of x is: 5
The value of y is: 6
```

因為我們使用 `5` 作為 `x` 的值，`6` 作為 `y` 的值來調用函數，因此列印出這兩個字串及相應的值。

### 包含語句和表達式的函數體

函數體由一系列的語句和一個可選的結尾表達式構成。目前為止，我們只介紹了沒有結尾表達式的函數，不過你已經見過作為語句一部分的表達式。因為 Rust 是一門基於表達式（expression-based）的語言，這是一個需要理解的（不同於其他語言）重要區別。其他語言並沒有這樣的區別，所以讓我們看看語句與表達式有什麼區別以及這些區別是如何影響函數體的。

實際上，我們已經使用過語句和表達式。**語句**（*Statements*）是執行一些操作但不返回值的指令。表達式（*Expressions*）計算並產生一個值。讓我們看一些例子：

使用 `let` 關鍵字創建變數並綁定一個值是一個語句。在列表 3-1 中，`let y = 6;` 是一個語句。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let y = 6;
}
```

<span class="caption">列表 3-1：包含一個語句的 `main` 函數定義</span>

函數定義也是語句，上面整個例子本身就是一個語句。

語句不返回值。因此，不能把 `let` 語句賦值給另一個變數，比如下面的例子嘗試做的，會產生一個錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let x = (let y = 6);
}
```

當運行這個程序時，會得到如下錯誤：

```text
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error: expected expression, found statement (`let`)
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^
  |
  = note: variable declaration using `let` is a statement
```

`let y = 6` 語句並不返回值，所以沒有可以綁定到 `x` 上的值。這與其他語言不同，例如 C 和 Ruby，它們的賦值語句會返回所賦的值。在這些語言中，可以這麼寫 `x = y = 6`，這樣 `x` 和 `y` 的值都是 `6`；Rust 中不能這樣寫。

表達式會計算出一些值，並且你將編寫的大部分 Rust 代碼是由表達式組成的。考慮一個簡單的數學運算，比如 `5 + 6`，這是一個表達式並計算出值 `11`。表達式可以是語句的一部分：在範例 3-1 中，語句 `let y = 6;` 中的 `6` 是一個表達式，它計算出的值是 `6`。函數調用是一個表達式。宏調用是一個表達式。我們用來創建新作用域的大括號（代碼塊），`{}`，也是一個表達式，例如：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 5;

    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {}", y);
}
```

這個表達式：

```rust,ignore
{
    let x = 3;
    x + 1
}
```

是一個代碼塊，它的值是 `4`。這個值作為 `let` 語句的一部分被綁定到 `y` 上。注意結尾沒有分號的那一行 `x+1`，與你見過的大部分代碼行不同。表達式的結尾沒有分號。如果在表達式的結尾加上分號，它就變成了語句，而語句不會返回值。在接下來探索具有返回值的函數和表達式時要謹記這一點。

### 具有返回值的函數

函數可以向調用它的代碼返回值。我們並不對返回值命名，但要在箭頭（`->`）後聲明它的類型。在 Rust 中，函數的返回值等同於函數體最後一個表達式的值。使用 `return` 關鍵字和指定值，可從函數中提前返回；但大部分函數隱式的返回最後的表達式。這是一個有返回值的函數的例子：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn five() -> i32 {
    5
}

fn main() {
    let x = five();

    println!("The value of x is: {}", x);
}
```

在 `five` 函數中沒有函數調用、宏、甚至沒有 `let` 語句——只有數字 `5`。這在 Rust 中是一個完全有效的函數。注意，也指定了函數返回值的類型，就是 `-> i32`。嘗試運行程式碼；輸出應該看起來像這樣：

```text
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30 secs
     Running `target/debug/functions`
The value of x is: 5
```

`five` 函數的返回值是 `5`，所以返回值類型是 `i32`。讓我們仔細檢查一下這段代碼。有兩個重要的部分：首先，`let x = five();` 這一行表明我們使用函數的返回值初始化一個變數。因為 `five` 函數返回 `5`，這一行與如下代碼相同：

```rust
let x = 5;
```

其次，`five` 函數沒有參數並定義了返回值類型，不過函數體只有單單一個 `5` 也沒有分號，因為這是一個表達式，我們想要返回它的值。

讓我們看看另一個例子：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {}", x);
}

fn plus_one(x: i32) -> i32 {
    x + 1
}
```

運行程式碼會列印出 `The value of x is: 6`。但如果在包含 `x + 1` 的行尾加上一個分號，把它從表達式變成語句，我們將看到一個錯誤。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {}", x);
}

fn plus_one(x: i32) -> i32 {
    x + 1;
}
```

運行程式碼會產生一個錯誤，如下：

```text
error[E0308]: mismatched types
 --> src/main.rs:7:28
  |
7 |   fn plus_one(x: i32) -> i32 {
  |  ____________________________^
8 | |     x + 1;
  | |          - help: consider removing this semicolon
9 | | }
  | |_^ expected i32, found ()
  |
  = note: expected type `i32`
             found type `()`
```

主要的錯誤訊息，“mismatched types”（類型不匹配），揭示了代碼的核心問題。函數 `plus_one` 的定義說明它要返回一個 `i32` 類型的值，不過語句並不會返回值，使用空元組 `()` 表示不返回值。因為不返回值與函數定義相矛盾，從而出現一個錯誤。在輸出中，Rust 提供了一條訊息，可能有助於糾正這個錯誤：它建議刪除分號，這會修復這個錯誤。

## 數據類型

> [ch03-02-data-types.md](https://github.com/rust-lang/book/blob/master/src/ch03-02-data-types.md)
> <br>
> commit 6598d3abac05ed1d0c45db92466ea49346d05e40

在 Rust 中，每一個值都屬於某一個 **數據類型**（*data type*），這告訴 Rust 它被指定為何種數據，以便明確數據處理方式。我們將看到兩類數據類型子集：標量（scalar）和複合（compound）。

記住，Rust 是 **靜態類型**（*statically typed*）語言，也就是說在編譯時就必須知道所有變數的類型。根據值及其使用方式，編譯器通常可以推斷出我們想要用的類型。當多種類型均有可能時，比如第二章的 [“比較猜測的數字和秘密數字”][comparing-the-guess-to-the-secret-number] 使用 `parse` 將 `String` 轉換為數字時，必須增加類型註解，像這樣：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

這裡如果不添加類型註解，Rust 會顯示如下錯誤，這說明編譯器需要我們提供更多訊息，來了解我們想要的類型：

```text
error[E0282]: type annotations needed
 --> src/main.rs:2:9
  |
2 |     let guess = "42".parse().expect("Not a number!");
  |         ^^^^^
  |         |
  |         cannot infer type for `_`
  |         consider giving `guess` a type
```

你會看到其它數據類型的各種類型註解。

### 標量類型

**標量**（*scalar*）類型代表一個單獨的值。Rust 有四種基本的標量類型：整型、浮點型、布爾類型和字元類型。你可能在其他語言中見過它們。讓我們深入了解它們在 Rust 中是如何工作的。

#### 整型

**整數** 是一個沒有小數部分的數字。我們在第二章使用過 `u32` 整數類型。該類型聲明表明，它關聯的值應該是一個占據 32 比特位的無符號整數（有符號整數類型以 `i` 開頭而不是 `u`）。表格 3-1 展示了 Rust 內建的整數類型。在有符號列和無符號列中的每一個變體（例如，`i16`）都可以用來聲明整數值的類型。

<span class="caption">表格 3-1: Rust 中的整型</span>

| 長度   | 有符號   | 無符號   |
|---------|---------|----------|
| 8-bit   | `i8`    | `u8`     |
| 16-bit  | `i16`   | `u16`    |
| 32-bit  | `i32`   | `u32`    |
| 64-bit  | `i64`   | `u64`    |
| 128-bit | `i128`  | `u128`   |
| arch    | `isize` | `usize`  |

每一個變體都可以是有符號或無符號的，並有一個明確的大小。**有符號** 和 **無符號** 代表數字能否為負值，換句話說，數字是否需要有一個符號（有符號數），或者永遠為正而不需要符號（無符號數）。這有點像在紙上書寫數字：當需要考慮符號的時候，數字以加號或減號作為前綴；然而，可以安全地假設為正數時，加號前綴通常省略。有符號數以[補碼形式（two’s complement representation）](https://en.wikipedia.org/wiki/Two%27s_complement) 存儲。

每一個有符號的變體可以儲存包含從 -(2<sup>n - 1</sup>) 到 2<sup>n - 1</sup> - 1 在內的數字，這裡 *n* 是變體使用的位數。所以 `i8` 可以儲存從 -(2<sup>7</sup>) 到 2<sup>7</sup> - 1 在內的數字，也就是從 -128 到 127。無符號的變體可以儲存從 0 到 2<sup>n</sup> - 1 的數字，所以 `u8` 可以儲存從 0 到 2<sup>8</sup> - 1 的數字，也就是從 0 到 255。

另外，`isize` 和 `usize` 類型依賴運行程序的計算機架構：64 位架構上它們是 64 位的， 32 位架構上它們是 32 位的。

可以使用表格 3-2 中的任何一種形式編寫數字字面值。注意除 byte 以外的所有數字字面值允許使用類型後綴，例如 `57u8`，同時也允許使用 `_` 做為分隔符以方便讀數，例如`1_000`。

<span class="caption">表格 3-2: Rust 中的整型字面值</span>

| 數字字面值        | 例子          |
|------------------|---------------|
| Decimal (十進位制)         | `98_222`      |
| Hex (十六進位制)             | `0xff`        |
| Octal (八進位制)           | `0o77`        |
| Binary (二進位制)          | `0b1111_0000` |
| Byte (單位元組字元)(僅限於`u8`) | `b'A'`        |

那麼該使用哪種類型的數字呢？如果拿不定主意，Rust 的默認類型通常就很好，數字類型預設是 `i32`：它通常是最快的，甚至在 64 位系統上也是。`isize` 或 `usize` 主要作為某些集合的索引。

> ##### 整型溢出
>
> 比方說有一個 `u8` ，它可以存放從零到 `255` 的值。那麼當你將其修改為 `256` 時會發生什麼事呢？這被稱為 “整型溢出”（“integer overflow” ），關於這一行為 Rust 有一些有趣的規則。當在 debug 模式編譯時，Rust 檢查這類問題並使程序 *panic*，這個術語被 Rust 用來表明程序因錯誤而退出。第九章 [“`panic!` 與不可恢復的錯誤”][unrecoverable-errors-with-panic] 部分會詳細介紹 panic。
>
> 在 release 構建中，Rust 不檢測溢出，相反會進行一種被稱為二進位制補碼包裝（*two’s complement wrapping*）的操作。簡而言之，`256` 變成 `0`，`257` 變成 `1`，依此類推。依賴整型溢出被認為是一種錯誤，即便可能出現這種行為。如果你確實需要這種行為，標準庫中有一個類型顯式提供此功能，[`Wrapping`][wrapping]。

#### 浮點型

Rust 也有兩個原生的 **浮點數**（*floating-point numbers*）類型，它們是帶小數點的數字。Rust 的浮點數類型是 `f32` 和 `f64`，分別占 32 位和 64 位。默認類型是 `f64`，因為在現代 CPU 中，它與 `f32` 速度幾乎一樣，不過精度更高。

這是一個展示浮點數的實例：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 2.0; // f64

    let y: f32 = 3.0; // f32
}
```

浮點數採用 IEEE-754 標準表示。`f32` 是單精度浮點數，`f64` 是雙精度浮點數。

#### 數值運算

Rust 中的所有數字類型都支持基本數學運算：加法、減法、乘法、除法和取余。下面的代碼展示了如何在 `let` 語句中使用它們：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    // 加法
    let sum = 5 + 10;

    // 減法
    let difference = 95.5 - 4.3;

    // 乘法
    let product = 4 * 30;

    // 除法
    let quotient = 56.7 / 32.2;

    // 取余
    let remainder = 43 % 5;
}
```

這些語句中的每個表達式使用了一個數學運算符並計算出了一個值，然後綁定給一個變數。附錄 B 包含 Rust 提供的所有運算符的列表。

#### 布爾型

正如其他大部分程式語言一樣，Rust 中的布爾類型有兩個可能的值：`true` 和 `false`。Rust 中的布爾類型使用 `bool` 表示。例如：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let t = true;

    let f: bool = false; // 顯式指定類型註解
}
```

使用布爾值的主要場景是條件表達式，例如 `if` 表達式。在 [“控制流”（“Control Flow”）][control-flow] 部分將介紹 `if` 表達式在 Rust 中如何工作。

#### 字元類型

目前為止只使用到了數字，不過 Rust 也支持字母。Rust 的 `char` 類型是語言中最原生的字母類型，如下代碼展示了如何使用它。（注意 `char` 由單引號指定，不同於字串使用雙引號。）

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let c = 'z';
    let z = 'ℤ';
    let heart_eyed_cat = '😻';
}
```

Rust 的 `char` 類型的大小為四個位元組(four bytes)，並代表了一個 Unicode 標量值（Unicode Scalar Value），這意味著它可以比 ASCII 表示更多內容。在 Rust 中，拼音字母（Accented letters），中文、日文、韓文等字元，emoji（繪文字）以及零長度的空白字元都是有效的 `char` 值。Unicode 標量值包含從 `U+0000` 到 `U+D7FF` 和 `U+E000` 到 `U+10FFFF` 在內的值。不過，“字元” 並不是一個 Unicode 中的概念，所以人直覺上的 “字元” 可能與 Rust 中的 `char` 並不符合。第八章的 [“使用字串存儲 UTF-8 編碼的文本”][strings] 中將詳細討論這個主題。

### 複合類型

**複合類型**（*Compound types*）可以將多個值組合成一個類型。Rust 有兩個原生的複合類型：元組（tuple）和數組（array）。

#### 元組類型

元組是一個將多個其他類型的值組合進一個複合類型的主要方式。元組長度固定：一旦聲明，其長度不會增大或縮小。

我們使用包含在圓括號中的逗號分隔的值列表來創建一個元組。元組中的每一個位置都有一個類型，而且這些不同值的類型也不必是相同的。這個例子中使用了可選的類型註解：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

`tup` 變數綁定到整個元組上，因為元組是一個單獨的複合元素。為了從元組中獲取單個值，可以使用模式匹配（pattern matching）來解構（destructure）元組值，像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let tup = (500, 6.4, 1);

    let (x, y, z) = tup;

    println!("The value of y is: {}", y);
}
```

程序首先創建了一個元組並綁定到 `tup` 變數上。接著使用了 `let` 和一個模式將 `tup` 分成了三個不同的變數，`x`、`y` 和 `z`。這叫做 **解構**（*destructuring*），因為它將一個元組拆成了三個部分。最後，程序列印出了 `y` 的值，也就是 `6.4`。

除了使用模式匹配解構外，也可以使用點號（`.`）後跟值的索引來直接訪問它們。例如：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```

這個程序創建了一個元組，`x`，並接著使用索引為每個元素創建新變數。跟大多數程式語言一樣，元組的第一個索引值是 0。

#### 數組類型

另一個包含多個值的方式是 **數組**（*array*）。與元組不同，數組中的每個元素的類型必須相同。Rust 中的數組與一些其他語言中的數組不同，因為 Rust 中的數組是固定長度的：一旦聲明，它們的長度不能增長或縮小。

Rust 中，數組中的值位於中括號內的逗號分隔的列表中：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
}
```

當你想要在棧（stack）而不是在堆（heap）上為數據分配空間（第四章將討論棧與堆的更多內容），或者是想要確保總是有固定數量的元素時，數組非常有用。但是數組並不如 vector 類型靈活。vector 類型是標準庫提供的一個 **允許** 增長和縮小長度的類似數組的集合類型。當不確定是應該使用數組還是 vector 的時候，你可能應該使用 vector。第八章會詳細討論 vector。

一個你可能想要使用數組而不是 vector 的例子是，當程序需要知道一年中月份的名字時。程序不大可能會去增加或減少月份。這時你可以使用數組，因為我們知道它總是包含 12 個元素：

```rust
let months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
```

可以像這樣編寫數組的類型：在方括號中包含每個元素的類型，後跟分號，再後跟數組元素的數量。

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

這裡，`i32` 是每個元素的類型。分號之後，數字 `5` 表明該數組包含五個元素。

以這種方式編寫數組的類型看起來類似於初始化數組的另一種語法：如果要為每個元素創建包含相同值的數組，可以指定初始值，後跟分號，然後在方括號中指定數組的長度，如下所示：

```rust
let a = [3; 5];
```

變數名為 `a` 的數組將包含 `5` 個元素，這些元素的值最初都將被設置為 `3`。這種寫法與 `let a = [3, 3, 3, 3, 3];` 效果相同，但更簡潔。

##### 訪問數組元素

數組是一整塊分配在棧上的記憶體。可以使用索引來訪問數組的元素，像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];

    let first = a[0];
    let second = a[1];
}
```

在這個例子中，叫做 `first` 的變數的值是 `1`，因為它是數組索引 `[0]` 的值。變數 `second` 將會是數組索引 `[1]` 的值 `2`。

##### 無效的數組元素訪問

如果我們訪問數組結尾之後的元素會發生什麼事呢？比如你將上面的例子改成下面這樣，這可以編譯通過，不過在運行時會因錯誤而退出：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,panics
fn main() {
    let a = [1, 2, 3, 4, 5];
    let index = 10;

    let element = a[index];

    println!("The value of element is: {}", element);
}
```

使用 `cargo run` 運行程式碼後會產生如下結果：

```text
$ cargo run
   Compiling arrays v0.1.0 (file:///projects/arrays)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/arrays`
thread 'main' panicked at 'index out of bounds: the len is 5 but the index is
 10', src/main.rs:5:19
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

編譯並沒有產生任何錯誤，不過程序會出現一個 **運行時**（*runtime*）錯誤並且不會成功退出。當嘗試用索引訪問一個元素時，Rust 會檢查指定的索引是否小於數組的長度。如果索引超出了數組長度，Rust 會 *panic*，這是 Rust 術語，它用於程序因為錯誤而退出的情況。

這是第一個在實戰中遇到的 Rust 安全原則的例子。在很多底層語言中，並沒有進行這類檢查，這樣當提供了一個不正確的索引時，就會訪問無效的記憶體。透過立即退出而不是允許記憶體訪問並繼續執行，Rust 讓你避開此類錯誤。第九章會討論更多 Rust 的錯誤處理。

[comparing-the-guess-to-the-secret-number]:
ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[control-flow]: ch03-05-control-flow.html#control-flow
[strings]: ch08-02-strings.html#storing-utf-8-encoded-text-with-strings
[unrecoverable-errors-with-panic]: ch09-01-unrecoverable-errors-with-panic.html
[wrapping]: ../std/num/struct.Wrapping.html

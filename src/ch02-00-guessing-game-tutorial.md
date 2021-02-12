# 編寫 猜猜看 遊戲

> [ch02-00-guessing-game-tutorial.md](https://github.com/rust-lang/book/blob/master/src/ch02-00-guessing-game-tutorial.md)
> <br>
> commit c427a676393d001edc82f1a54a3b8026abcf9690

讓我們一起動手完成一個項目，來快速上手 Rust！本章將介紹 Rust 中一些常用概念，並透過真實的程序來展示如何運用它們。你將會學到 `let`、`match`、方法、關聯函數、外部 crate 等知識！後續章節會深入探討這些概念的細節。在這一章，我們將做基礎練習。

我們會實現一個經典的新手編程問題：猜猜看遊戲。它是這麼工作的：程序將會隨機生成一個 1 到 100 之間的隨機整數。接著它會請玩家猜一個數並輸入，然後提示猜測是大了還是小了。如果猜對了，它會列印祝賀訊息並退出。

## 準備一個新項目

要創建一個新項目，進入第一章中創建的 *projects* 目錄，使用 Cargo 新建一個項目，如下：

```text
$ cargo new guessing_game
$ cd guessing_game
```

第一個命令，`cargo new`，它獲取項目的名稱（`guessing_game`）作為第一個參數。第二個命令進入到新創建的項目目錄。

看看生成的 *Cargo.toml* 文件：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[package]
name = "guessing_game"
version = "0.1.0"
authors = ["Your Name <you@example.com>"]
edition = "2018"

[dependencies]
```

如果 Cargo 從環境中獲取的開發者訊息不正確，修改這個文件並再次保存。

正如第一章那樣，`cargo new` 生成了一個 “Hello, world!” 程序。查看 *src/main.rs* 文件：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    println!("Hello, world!");
}
```

現在使用 `cargo run` 命令，一步完成 “Hello, world!” 程序的編譯和運行：

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 1.50 secs
     Running `target/debug/guessing_game`
Hello, world!
```

當你需要在項目中快速疊代時，`run` 命令就能派上用場，正如我們在這個遊戲項目中做的，在下一次疊代之前快速測試每一次疊代。

重新打開 *src/main.rs* 文件。我們將會在這個文件中編寫全部的代碼。

## 處理一次猜測

猜猜看程序的第一部分請求和處理用戶輸入，並檢查輸入是否符合預期的格式。首先，允許玩家輸入猜測。在 *src/main.rs* 中輸入範例 2-1 中的代碼。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use std::io;

fn main() {
    println!("Guess the number!");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin().read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {}", guess);
}
```

<span class="caption">範例 2-1：獲取用戶猜測並列印的代碼</span>

這些程式碼包含很多訊息，我們一行一行地過一遍。為了獲取用戶輸入並列印結果作為輸出，我們需要將 `io`（輸入/輸出）庫引入當前作用域。`io` 庫來自於標準庫（也被稱為 `std`）：

```rust,ignore
use std::io;
```

默認情況下，Rust 將 [*prelude*][prelude]<!-- ignore --> 模組中少量的類型引入到每個程序的作用域中。如果需要的類型不在 prelude 中，你必須使用 `use` 語句顯式地將其引入作用域。`std::io` 庫提供很多有用的功能，包括接收用戶輸入的功能。

[prelude]: https://doc.rust-lang.org/std/prelude/index.html

如第一章所提及，`main` 函數是程序的入口點：

```rust,ignore
fn main() {
```

`fn` 語法聲明了一個新函數，`()` 表明沒有參數，`{` 作為函數體的開始。

第一章也提及了 `println!` 是一個在螢幕上列印字串的宏：

```rust,ignore
println!("Guess the number!");

println!("Please input your guess.");
```

這些程式碼僅僅列印提示，介紹遊戲的內容然後請求用戶輸入。

### 使用變數儲存值

接下來，創建一個儲存用戶輸入的地方，像這樣：

```rust,ignore
let mut guess = String::new();
```

現在程序開始變得有意思了！這一小行程式碼發生了很多事。注意這是一個 `let` 語句，用來創建 **變數**（*variable*）。這裡是另外一個例子：

```rust,ignore
let foo = bar;
```

這行程式碼新建了一個叫做 `foo` 的變數並把它綁定到值 `bar` 上。在 Rust 中，變數預設是不可變的。我們將會在第三章的 [“變數與可變性”][variables-and-mutability] 部分詳細討論這個概念。下面的例子展示了如何在變數名前使用 `mut` 來使一個變數可變：

```rust,ignore
let foo = 5; // 不可變
let mut bar = 5; // 可變
```

> 注意：`//` 語法開始一個注釋，持續到行尾。Rust 忽略注釋中的所有內容，第三章將會詳細介紹注釋。

讓我們回到猜猜看程序中。現在我們知道了 `let mut guess` 會引入一個叫做 `guess` 的可變變數。等號（`=`）的右邊是 `guess` 所綁定的值，它是 `String::new` 的結果，這個函數會返回一個 `String` 的新實例。[`String`][string]<!-- ignore --> 是一個標準庫提供的字串類型，它是 UTF-8 編碼的可增長文本塊。

[string]: https://doc.rust-lang.org/std/string/struct.String.html

`::new` 那一行的 `::` 語法表明 `new` 是 `String` 類型的一個 **關聯函數**（*associated function*）。關聯函數是針對類型實現的，在這個例子中是 `String`，而不是 `String` 的某個特定實例。一些語言中把它稱為 **靜態方法**（*static method*）。

`new` 函數創建了一個新的空字串，你會發現很多類型上有 `new` 函數，因為它是創建類型實例的慣用函數名。

總結一下，`let mut guess = String::new();` 這一行創建了一個可變變數，當前它綁定到一個新的 `String` 空實例上。

回憶一下，我們在程序的第一行使用 `use std::io;` 從標準庫中引入了輸入/輸出功能。現在調用 `io` 庫中的函數 `stdin`：

```rust,ignore
io::stdin().read_line(&mut guess)
    .expect("Failed to read line");
```

如果程序的開頭沒有 `use std::io` 這一行，可以把函數調用寫成 `std::io::stdin`。`stdin` 函數返回一個 [`std::io::Stdin`][iostdin]<!-- ignore --> 的實例，這代表終端標準輸入句柄的類型。

[iostdin]: https://doc.rust-lang.org/std/io/struct.Stdin.html

代碼的下一部分，`.read_line(&mut guess)`，調用 [`read_line`][read_line]<!-- ignore --> 方法從標準輸入句柄獲取用戶輸入。我們還向 `read_line()` 傳遞了一個參數：`&mut guess`。

[read_line]: https://doc.rust-lang.org/std/io/struct.Stdin.html#method.read_line

`read_line` 的工作是，無論用戶在標準輸入中鍵入什麼內容，都將其存入一個字串中，因此它需要字串作為參數。這個字串參數應該是可變的，以便 `read_line` 將用戶輸入附加上去。

`&` 表示這個參數是一個 **引用**（*reference*），它允許多處代碼訪問同一處數據，而無需在記憶體中多次拷貝。引用是一個複雜的特性，Rust 的一個主要優勢就是安全而簡單的操縱引用。完成當前程序並不需要了解如此多細節。現在，我們只需知道它像變數一樣，預設是不可變的。因此，需要寫成 `&mut guess` 來使其可變，而不是 `&guess`。（第四章會更全面的解釋引用。）

### 使用 `Result` 類型來處理潛在的錯誤

我們還沒有完全分析完這行程式碼。雖然這是單獨一行程式碼，但它是邏輯行（雖然換行了但仍是語句）的一部分。後一部分是這個方法：

```rust,ignore
.expect("Failed to read line");
```

當使用 `.foo()` 語法調用方法時，透過換行加縮進來把長行拆開是明智的。我們完全可以這樣寫：

```rust,ignore
io::stdin().read_line(&mut guess).expect("Failed to read line");
```

不過，過長的行難以閱讀，所以最好拆開來寫，兩個方法調用占兩行。現在來看看這行程式碼做了什麼。

之前提到了 `read_line` 將用戶輸入附加到傳遞給它的字串中，不過它也返回一個值——在這個例子中是 [`io::Result`][ioresult]<!-- ignore -->。Rust 標準庫中有很多叫做 `Result` 的類型：一個通用的 [`Result`][result]<!-- ignore --> 以及在子模組中的特化版本，比如 `io::Result`。

[ioresult]: https://doc.rust-lang.org/std/io/type.Result.html
[result]: https://doc.rust-lang.org/std/result/enum.Result.html

`Result` 類型是 [*枚舉*（*enumerations*）][enums]<!-- ignore -->，通常也寫作 *enums*。枚舉類型持有固定集合的值，這些值被稱為枚舉的 **成員**（*variants*）。第六章將介紹枚舉的更多細節。

[enums]: ch06-00-enums.html

`Result` 的成員是 `Ok` 和 `Err`，`Ok` 成員表示操作成功，內部包含成功時產生的值。`Err` 成員則意味著操作失敗，並且包含失敗的前因後果。

這些 `Result` 類型的作用是編碼錯誤處理訊息。`Result` 類型的值，像其他類型一樣，擁有定義於其上的方法。`io::Result` 的實例擁有 [`expect` 方法][expect]<!-- ignore -->。如果 `io::Result` 實例的值是 `Err`，`expect` 會導致程序崩潰，並顯示當做參數傳遞給 `expect` 的訊息。如果 `read_line` 方法返回 `Err`，則可能是來源於底層操作系統錯誤的結果。如果 `io::Result` 實例的值是 `Ok`，`expect` 會獲取 `Ok` 中的值並原樣返回。在本例中，這個值是用戶輸入到標準輸入中的位元組數。

[expect]: https://doc.rust-lang.org/std/result/enum.Result.html#method.expect

如果不調用 `expect`，程序也能編譯，不過會出現一個警告：

```text
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
warning: unused `std::result::Result` which must be used
  --> src/main.rs:10:5
   |
10 |     io::stdin().read_line(&mut guess);
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: #[warn(unused_must_use)] on by default
```

Rust 警告我們沒有使用 `read_line` 的返回值 `Result`，說明有一個可能的錯誤沒有處理。

消除警告的正確做法是實際編寫錯誤處理代碼，不過由於我們就是希望程序在出現問題時立即崩潰，所以直接使用 `expect`。第九章會學習如何從錯誤中恢復。

### 使用 `println!` 占位符列印值

除了位於結尾的大括號，目前為止就只有這一行程式碼值得討論一下了，就是這一行：

```rust,ignore
println!("You guessed: {}", guess);
```

這行程式碼列印存儲用戶輸入的字串。第一個參數是格式化字串，裡面的 `{}` 是預留在特定位置的占位符。使用 `{}` 也可以列印多個值：第一對 `{}` 使用格式化字串之後的第一個值，第二對則使用第二個值，依此類推。調用一次 `println!` 列印多個值看起來像這樣：

```rust
let x = 5;
let y = 10;

println!("x = {} and y = {}", x, y);
```

這行程式碼會列印出 `x = 5 and y = 10`。

### 測試第一部分代碼

讓我們來測試一下猜猜看遊戲的第一部分。使用 `cargo run` 運行：

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 2.53 secs
     Running `target/debug/guessing_game`
Guess the number!
Please input your guess.
6
You guessed: 6
```

至此為止，遊戲的第一部分已經完成：我們從鍵盤獲取輸入並列印了出來。

## 生成一個秘密數字

接下來，需要生成一個秘密數字，好讓用戶來猜。秘密數字應該每次都不同，這樣重複玩才不會乏味；範圍應該在 1 到 100 之間，這樣才不會太困難。Rust 標準庫中尚未包含隨機數功能。然而，Rust 團隊還是提供了一個 [`rand` crate][randcrate]。

[randcrate]: https://crates.io/crates/rand

### 使用 crate 來增加更多功能

記住，*crate* 是一個 Rust 代碼包。我們正在構建的項目是一個 **二進位制 crate**，它生成一個可執行文件。 `rand` crate 是一個 **庫 crate**，庫 crate 可以包含任意能被其他程序使用的代碼。

Cargo 對外部 crate 的運用是其真正閃光的地方。在我們使用 `rand` 編寫程式碼之前，需要修改 *Cargo.toml* 文件，引入一個 `rand` 依賴。現在打開這個文件並在底部的 `[dependencies]` 片段標題之下添加：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[dependencies]

rand = "0.5.5"
```

在 *Cargo.toml* 文件中，標題以及之後的內容屬同一個片段，直到遇到下一個標題才開始新的片段。`[dependencies]` 片段告訴 Cargo 本項目依賴了哪些外部 crate 及其版本。本例中，我們使用語義化版本 `0.5.5` 來指定 `rand` crate。Cargo 理解[語義化版本（Semantic Versioning）][semver]<!-- ignore -->（有時也稱為 *SemVer*），這是一種定義版本號的標準。`0.5.5` 事實上是 `^0.5.5` 的簡寫，它表示 “任何與 0.5.5 版本公有 API 相相容的版本”。

[semver]: http://semver.org

現在，不修改任何代碼，構建項目，如範例 2-2 所示：

```text
$ cargo build
    Updating crates.io index
  Downloaded rand v0.5.5
  Downloaded libc v0.2.62
  Downloaded rand_core v0.2.2
  Downloaded rand_core v0.3.1
  Downloaded rand_core v0.4.2
   Compiling rand_core v0.4.2
   Compiling libc v0.2.62
   Compiling rand_core v0.3.1
   Compiling rand_core v0.2.2
   Compiling rand v0.5.5
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 2.53 s
```

<span class="caption">範例 2-2: 將 rand crate 添加為依賴之後運行 `cargo build` 的輸出</span>

可能會出現不同的版本號（多虧了語義化版本，它們與代碼是相容的！），同時顯示順序也可能會有所不同。

現在我們有了一個外部依賴，Cargo 從 *registry* 上獲取所有包的最新版本訊息，這是一份來自 [Crates.io][cratesio] 的數據拷貝。Crates.io 是 Rust 生態環境中的開發者們向他人貢獻 Rust 開源項目的地方。

[cratesio]: https://crates.io

在更新完 registry 後，Cargo 檢查 `[dependencies]` 片段並下載缺失的 crate 。本例中，雖然只聲明了 `rand` 一個依賴，然而 Cargo 還是額外獲取了 `libc` 和 `rand_core` 的拷貝，因為 `rand` 依賴 `libc` 和 `rand_core` 來正常工作。下載完成後，Rust 編譯依賴，然後使用這些依賴編譯項目。

如果不做任何修改，立刻再次運行 `cargo build`，則不會看到任何除了 `Finished` 行之外的輸出。Cargo 知道它已經下載並編譯了依賴，同時 *Cargo.toml* 文件也沒有變動。Cargo 還知道代碼也沒有任何修改，所以它不會重新編譯代碼。因為無事可做，它簡單的退出了。

如果打開 *src/main.rs* 文件，做一些無關緊要的修改，保存並再次構建，則會出現兩行輸出：

```text
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 2.53 secs
```

這一行表示 Cargo 只針對 *src/main.rs* 文件的微小修改而更新構建。依賴沒有變化，所以 Cargo 知道它可以復用已經為此下載並編譯的代碼。它只是重新構建了部分（項目）代碼。

#### *Cargo.lock* 文件確保構建是可重現的

Cargo 有一個機制來確保任何人在任何時候重新構建代碼，都會產生相同的結果：Cargo 只會使用你指定的依賴版本，除非你又手動指定了別的。例如，如果下週 `rand` crate 的 `0.5.6` 版本出來了，它修復了一個重要的 bug，同時也含有一個會破壞代碼運行的缺陷，這時會發生什麼事呢？

這個問題的答案是 *Cargo.lock* 文件。它在第一次執行 `cargo build` 時創建，並放在 *guessing_game* 目錄。當第一次構建項目時，Cargo 計算出所有符合要求的依賴版本並寫入 *Cargo.lock* 文件。當將來構建項目時，Cargo 會發現 *Cargo.lock* 已存在併使用其中指定的版本，而不是再次計算所有的版本。這使得你擁有了一個自動化的可重現的構建。換句話說，項目會持續使用 `0.5.5` 直到你顯式升級，多虧有了 *Cargo.lock* 文件。

#### 更新 crate 到一個新版本

當你 **確實** 需要升級 crate 時，Cargo 提供了另一個命令，`update`，它會忽略 *Cargo.lock* 文件，並計算出所有符合 *Cargo.toml* 聲明的最新版本。如果成功了，Cargo 會把這些版本寫入 *Cargo.lock* 文件。

不過，Cargo 默認只會尋找大於 `0.5.5` 而小於 `0.6.0` 的版本。如果 `rand` crate 發布了兩個新版本，`0.5.6` 和 `0.6.0`，在運行 `cargo update` 時會出現如下內容：

```text
$ cargo update
    Updating crates.io index
    Updating rand v0.5.5 -> v0.5.6
```

這時，你也會注意到的 *Cargo.lock* 文件中的變化無外乎現在使用的 `rand` crate 版本是`0.5.6`

如果想要使用 `0.6.0` 版本的 `rand` 或是任何 `0.6.x` 系列的版本，必須像這樣更新 *Cargo.toml* 文件：

```toml
[dependencies]

rand = "0.6.0"
```

下一次執行 `cargo build` 時，Cargo 會從 registry 更新可用的 crate，並根據你指定的新版本重新計算。

第十四章會講到 [Cargo][doccargo]<!-- ignore --> 及其[生態系統][doccratesio]<!-- ignore --> 的更多內容，不過目前你只需要了解這麼多。通過 Cargo 復用庫文件非常容易，因此 Rustacean 能夠編寫出由很多包組裝而成的更輕巧的項目。

[doccargo]: http://doc.crates.io
[doccratesio]: http://doc.crates.io/crates-io.html

### 生成一個隨機數

你已經把 `rand` crate 添加到 *Cargo.toml* 了，讓我們開始使用 `rand`。下一步是更新 *src/main.rs*，如範例 2-3 所示。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use std::io;
use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1, 101);

    println!("The secret number is: {}", secret_number);

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin().read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {}", guess);
}
```

<span class="caption">範例 2-3：添加生成隨機數的代碼</span>

首先，我們新增了一行 `use`：`use rand::Rng`。`Rng` 是一個 trait，它定義了隨機數生成器應實現的方法，想使用這些方法的話，此 trait 必須在作用域中。第十章會詳細介紹 trait。

接下來，我們在中間還新增加了兩行。`rand::thread_rng` 函數提供實際使用的隨機數生成器：它位於當前執行執行緒的本地環境中，並從操作系統獲取 seed。接下來，調用隨機數生成器的 `gen_range` 方法。這個方法由剛才引入到作用域的 `Rng` trait 定義。`gen_range` 方法獲取兩個數字作為參數，並生成一個範圍在兩者之間的隨機數。它包含下限但不包含上限，所以需要指定 `1` 和 `101` 來請求一個 1 和 100 之間的數。

> 注意：你不可能憑空就知道應該 use 哪個 trait 以及該從 crate 中調用哪個方法。crate 的使用說明位於其文件中。Cargo 有一個很棒的功能是：運行 `cargo doc --open` 命令來構建所有本地依賴提供的文件，並在瀏覽器中打開。例如，假設你對 `rand` crate 中的其他功能感興趣，你可以運行 `cargo doc --open` 並點擊左側導航欄中的 `rand`。

新增加的第二行程式碼列印出了秘密數字。這在開發程序時很有用，因為可以測試它，不過在最終版本中會刪掉它。如果遊戲一開始就列印出結果就沒什麼可玩的了！

嘗試運行程序幾次：

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 2.53 secs
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 7
Please input your guess.
4
You guessed: 4
$ cargo run
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 83
Please input your guess.
5
You guessed: 5
```

你應該能得到不同的隨機數，同時它們應該都是在 1 和 100 之間的。做得漂亮！

## 比較猜測的數字和秘密數字

現在有了用戶輸入和一個隨機數，我們可以比較它們。這個步驟如範例 2-4 所示。注意這段代碼還不能通過編譯，我們稍後會解釋。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use std::io;
use std::cmp::Ordering;
use rand::Rng;

fn main() {

    // ---snip---

    println!("You guessed: {}", guess);

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

<span class="caption">範例 2-4：處理比較兩個數字可能的返回值</span>

新代碼的第一行是另一個 `use`，從標準庫引入了一個叫做 `std::cmp::Ordering` 的類型。同 `Result` 一樣， `Ordering` 也是一個枚舉，不過它的成員是 `Less`、`Greater` 和 `Equal`。這是比較兩個值時可能出現的三種結果。

接著，底部的五行新代碼使用了 `Ordering` 類型，`cmp` 方法用來比較兩個值並可以在任何可比較的值上調用。它獲取一個被比較值的引用：這裡是把 `guess` 與 `secret_number` 做比較。 然後它會返回一個剛才通過 `use` 引入作用域的 `Ordering` 枚舉的成員。使用一個 [`match`][match]<!-- ignore --> 表達式，根據對 `guess` 和 `secret_number` 調用 `cmp` 返回的 `Ordering` 成員來決定接下來做什麼。

[match]: ch06-02-match.html

一個 `match` 表達式由 **分支（arms）** 構成。一個分支包含一個 **模式**（*pattern*）和表達式開頭的值與分支模式相匹配時應該執行的代碼。Rust 獲取提供給 `match` 的值並挨個檢查每個分支的模式。`match` 結構和模式是 Rust 中強大的功能，它體現了代碼可能遇到的多種情形，並幫助你確保沒有遺漏處理。這些功能將分別在第六章和第十八章詳細介紹。

讓我們看看使用 `match` 表達式的例子。假設用戶猜了 50，這時隨機生成的秘密數字是 38。比較 50 與 38 時，因為 50 比 38 要大，`cmp` 方法會返回 `Ordering::Greater`。`Ordering::Greater` 是 `match` 表達式得到的值。它檢查第一個分支的模式，`Ordering::Less` 與 `Ordering::Greater`並不匹配，所以它忽略了這個分支的代碼並來到下一個分支。下一個分支的模式是 `Ordering::Greater`，**正確** 匹配！這個分支關聯的代碼被執行，在螢幕列印出 `Too big!`。`match` 表達式就此終止，因為該場景下沒有檢查最後一個分支的必要。

然而，範例 2-4 的代碼並不能編譯，可以嘗試一下：

```text
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
error[E0308]: mismatched types
  --> src/main.rs:23:21
   |
23 |     match guess.cmp(&secret_number) {
   |                     ^^^^^^^^^^^^^^ expected struct `std::string::String`, found integer
   |
   = note: expected type `&std::string::String`
   = note:    found type `&{integer}`

error: aborting due to previous error
Could not compile `guessing_game`.
```

錯誤的核心表明這裡有 **不匹配的類型**（*mismatched types*）。Rust 有一個靜態強類型系統，同時也有類型推斷。當我們寫出 `let guess = String::new()` 時，Rust 推斷出 `guess` 應該是 `String` 類型，並不需要我們寫出類型。另一方面，`secret_number`，是數字類型。幾個數字類型擁有 1 到 100 之間的值：32 位數字 `i32`；32 位無符號數字 `u32`；64 位數字 `i64` 等等。Rust 預設使用 `i32`，所以它是 `secret_number` 的類型，除非增加類型訊息，或任何能讓 Rust 推斷出不同數值類型的訊息。這裡錯誤的原因在於 Rust 不會比較字串類型和數字類型。

所以我們必須把從輸入中讀取到的 `String` 轉換為一個真正的數字類型，才好與秘密數字進行比較。這可以通過在 `main` 函數體中增加如下兩行程式碼來實現：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
// --snip--

    let mut guess = String::new();

    io::stdin().read_line(&mut guess)
        .expect("Failed to read line");

    let guess: u32 = guess.trim().parse()
        .expect("Please type a number!");

    println!("You guessed: {}", guess);

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

這兩行新代碼是：

```rust,ignore
let guess: u32 = guess.trim().parse()
    .expect("Please type a number!");
```

這裡創建了一個叫做 `guess` 的變數。不過等等，不是已經有了一個叫做 `guess` 的變數了嗎？確實如此，不過 Rust 允許用一個新值來 **隱藏** （*shadow*） `guess` 之前的值。這個功能常用在需要轉換值類型之類的場景。它允許我們復用 `guess` 變數的名字，而不是被迫創建兩個不同變數，諸如 `guess_str` 和 `guess` 之類。（第三章會介紹 shadowing 的更多細節。）

我們將 `guess` 綁定到 `guess.trim().parse()` 表達式上。表達式中的 `guess` 是包含輸入的原始 `String` 類型。`String` 實例的 `trim` 方法會去除字串開頭和結尾的空白字元。`u32` 只能由數字字元轉換，不過用戶必須輸入 <span class="keystroke">enter</span> 鍵才能讓 `read_line` 返回，然而用戶按下 <span class="keystroke">enter</span> 鍵時，會在字串中增加一個換行（newline）符。例如，用戶輸入 <span class="keystroke">5</span> 並按下 <span class="keystroke">enter</span>，`guess` 看起來像這樣：`5\n`。`\n` 代表 “換行”，確認鍵。`trim` 方法消除 `\n`，只留下 `5`。

[字串的 `parse` 方法][parse]<!-- ignore --> 將字串解析成數字。因為這個方法可以解析多種數字類型，因此需要告訴 Rust 具體的數字類型，這裡通過 `let guess: u32` 指定。`guess` 後面的冒號（`:`）告訴 Rust 我們指定了變數的類型。Rust 有一些內建的數字類型；`u32` 是一個無符號的 32 位整型。對於不大的正整數來說，它是不錯的類型，第三章還會講到其他數字類型。另外，程序中的 `u32` 註解以及與 `secret_number` 的比較，意味著 Rust 會推斷出 `secret_number` 也是 `u32` 類型。現在可以使用相同類型比較兩個值了！

[parse]: https://doc.rust-lang.org/std/primitive.str.html#method.parse

`parse` 調用很容易產生錯誤。例如，字串中包含 `A👍%`，就無法將其轉換為一個數字。因此，`parse` 方法返回一個 `Result` 類型。像之前 [“使用 `Result` 類型來處理潛在的錯誤”](#handling-potential-failure-with-the-result-type) 討論的 `read_line` 方法那樣，再次按部就班的用 `expect` 方法處理即可。如果 `parse` 不能從字串生成一個數字，返回一個 `Result` 的 `Err` 成員時，`expect` 會使遊戲崩潰並列印附帶的訊息。如果 `parse` 成功地將字串轉換為一個數字，它會返回 `Result` 的 `Ok` 成員，然後 `expect` 會返回 `Ok` 值中的數字。

現在讓我們運行程序！

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 0.43 secs
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 58
Please input your guess.
  76
You guessed: 76
Too big!
```

漂亮！即便是在猜測之前添加了空格，程序依然能判斷出用戶猜測了 76。多運行程序幾次，輸入不同的數字來檢驗不同的行為：猜一個正確的數字，猜一個過大的數字和猜一個過小的數字。

現在遊戲已經大體上能玩了，不過用戶只能猜一次。增加一個循環來改變它吧！

## 使用循環來允許多次猜測

`loop` 關鍵字創建了一個無限循環。將其加入後，用戶可以反覆猜測：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
// --snip--

    println!("The secret number is: {}", secret_number);

    loop {
        println!("Please input your guess.");

        // --snip--

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => println!("You win!"),
        }
    }
}
```

如上所示，我們將提示用戶猜測之後的所有內容放入了循環。確保 loop 循環中的代碼多縮進四個空格，再次運行程序。注意這裡有一個新問題，因為程序忠實地執行了我們的要求：永遠地請求另一個猜測，用戶好像無法退出啊！

用戶總能使用 <span class="keystroke">ctrl-c</span> 終止程式。不過還有另一個方法跳出無限循環，就是 [“比較猜測與秘密數字”](#comparing-the-guess-to-the-secret-number) 部分提到的 `parse`：如果用戶輸入的答案不是一個數字，程序會崩潰。用戶可以利用這一點來退出，如下所示：

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished dev [unoptimized + debuginfo] target(s) in 1.50 secs
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 59
Please input your guess.
45
You guessed: 45
Too small!
Please input your guess.
60
You guessed: 60
Too big!
Please input your guess.
59
You guessed: 59
You win!
Please input your guess.
quit
thread 'main' panicked at 'Please type a number!: ParseIntError { kind: InvalidDigit }', src/libcore/result.rs:785
note: Run with `RUST_BACKTRACE=1` for a backtrace.
error: Process didn't exit successfully: `target/debug/guess` (exit code: 101)
```

輸入 `quit` 確實退出了程序，同時其他任何非數字輸入也一樣。然而，這並不理想，我們想要當猜測正確的數字時遊戲能自動退出。

### 猜測正確後退出

讓我們增加一個 `break` 語句，在用戶猜對時退出遊戲：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
// --snip--

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

通過在 `You win!` 之後增加一行 `break`，用戶猜對了神秘數字後會退出循環。退出循環也意味著退出程序，因為循環是 `main` 的最後一部分。

### 處理無效輸入

為了進一步改善遊戲性，不要在用戶輸入非數字時崩潰，需要忽略非數字，讓用戶可以繼續猜測。可以通過修改 `guess` 將 `String` 轉化為 `u32` 那部分代碼來實現，如範例 2-5 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
// --snip--

io::stdin().read_line(&mut guess)
    .expect("Failed to read line");

let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,
};

println!("You guessed: {}", guess);

// --snip--
```

<span class="caption">範例 2-5: 忽略非數字的猜測並重新請求數字而不是讓程序崩潰</span>

將 `expect` 調用換成 `match` 語句，是從遇到錯誤就崩潰轉換到真正處理錯誤的慣用方法。須知 `parse` 返回一個 `Result` 類型，而 `Result` 是一個擁有 `Ok` 或 `Err` 成員的枚舉。這裡使用的 `match` 表達式，和之前處理 `cmp` 方法返回 `Ordering` 時用的一樣。

如果 `parse` 能夠成功的將字串轉換為一個數字，它會返回一個包含結果數字的 `Ok`。這個 `Ok` 值與 `match` 第一個分支的模式相匹配，該分支對應的動作返回 `Ok` 值中的數字 `num`，最後如願變成新創建的 `guess` 變數。

如果 `parse` *不* 能將字串轉換為一個數字，它會返回一個包含更多錯誤訊息的 `Err`。`Err` 值不能匹配第一個 `match` 分支的 `Ok(num)` 模式，但是會匹配第二個分支的 `Err(_)` 模式：`_` 是一個通配符值，本例中用來匹配所有 `Err` 值，不管其中有何種訊息。所以程序會執行第二個分支的動作，`continue` 意味著進入 `loop` 的下一次循環，請求另一個猜測。這樣程序就有效的忽略了 `parse` 可能遇到的所有錯誤！

現在萬事俱備，只需運行 `cargo run`：

```text
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 61
Please input your guess.
10
You guessed: 10
Too small!
Please input your guess.
99
You guessed: 99
Too big!
Please input your guess.
foo
Please input your guess.
61
You guessed: 61
You win!
```

太棒了！再有最後一個小的修改，就能完成猜猜看遊戲了：還記得程序依然會列印出秘密數字。在測試時還好，但正式發布時會毀了遊戲。刪掉列印秘密數字的 `println!`。範例 2-6 為最終代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use std::io;
use std::cmp::Ordering;
use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1, 101);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin().read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {}", guess);

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

<span class="caption">範例 2-6：猜猜看遊戲的完整代碼</span>

## 總結

此時此刻，你順利完成了猜猜看遊戲。恭喜！

本項目通過動手實踐，向你介紹了 Rust 新概念：`let`、`match`、方法、關聯函數、使用外部 crate 等等，接下來的幾章，你會繼續深入學習這些概念。第三章介紹大部分程式語言都有的概念，比如變數、數據類型和函數，以及如何在 Rust 中使用它們。第四章探索所有權（ownership），這是一個 Rust 同其他語言大不相同的功能。第五章討論結構體和方法的語法，而第六章側重解釋枚舉。

[variables-and-mutability]:
ch03-01-variables-and-mutability.html#variables-and-mutability

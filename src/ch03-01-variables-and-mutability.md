## 變數和可變性

> [ch03-01-variables-and-mutability.md](https://github.com/rust-lang/book/blob/master/src/ch03-01-variables-and-mutability.md)
> <br>
> commit d69b1058c660abfe1d274c58d39c06ebd5c96c47

第二章中提到過，變數預設是不可改變的（immutable）。這是推動你以充分利用 Rust 提供的安全性和簡單並發性來編寫程式碼的眾多方式之一。不過，你仍然可以使用可變變數。讓我們探討一下 Rust 為何及如何鼓勵你利用不可變性，以及何時你會選擇不使用不可變性。

當變數不可變時，一旦值被綁定一個名稱上，你就不能改變這個值。為了對此進行說明，使用 `cargo new variables` 命令在 *projects* 目錄生成一個叫做 *variables* 的新項目。

接著，在新建的 *variables* 目錄，打開 *src/main.rs* 並將代碼替換為如下代碼，這些程式碼還不能編譯：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

保存並使用 `cargo run` 運行程序。應該會看到一條錯誤訊息，如下輸出所示：

```text
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:4:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
3 |     println!("The value of x is: {}", x);
4 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
```

這個例子展示了編譯器如何幫助你找出程序中的錯誤。雖然編譯錯誤令人沮喪，但那只是表示程序不能安全的完成你想讓它完成的工作；並 **不能** 說明你不是一個好程式設計師！經驗豐富的 Rustacean 們一樣會遇到編譯錯誤。

錯誤訊息指出錯誤的原因是 `不能對不可變變數 x 二次賦值`（`cannot assign twice to immutable variable x`），因為你嘗試對不可變變數 `x` 賦第二個值。

在嘗試改變預設為不可變的值時，產生編譯時錯誤是很重要的，因為這種情況可能導致 bug。如果一部分代碼假設一個值永遠也不會改變，而另一部分代碼改變了這個值，第一部分代碼就有可能以不可預料的方式運行。不得不承認這種 bug 的起因難以跟蹤，尤其是第二部分代碼只是 **有時** 會改變值。

Rust 編譯器保證，如果聲明一個值不會變，它就真的不會變。這意味著當閱讀和編寫程式碼時，不需要追蹤一個值如何和在哪可能會被改變，從而使得代碼易於推導。

不過可變性也是非常有用的。變數只是默認不可變；正如在第二章所做的那樣，你可以在變數名之前加 `mut` 來使其可變。除了允許改變值之外，`mut` 向讀者表明了其他代碼將會改變這個變數值的意圖。

例如，讓我們將 *src/main.rs* 修改為如下代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}
```

現在運行這個程序，出現如下內容：

```text
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30 secs
     Running `target/debug/variables`
The value of x is: 5
The value of x is: 6
```

通過 `mut`，允許把綁定到 `x` 的值從 `5` 改成 `6`。在一些情況下，你會想用可變變數，因為與只用不可變變數相比，它會讓代碼更容易編寫。

除了防止出現 bug 外，還有很多地方需要權衡取捨。例如，使用大型數據結構時，適當地使用可變變數，可能比複製和返回新分配的實例更快。對於較小的數據結構，總是創建新實例，採用更偏向函數式的程式風格，可能會使代碼更易理解，為可讀性而犧牲性能或許是值得的。

### 變數和常量的區別

不允許改變值的變數，可能會使你想起另一個大部分程式語言都有的概念：**常量**（*constants*）。類似於不可變變數，常量是綁定到一個名稱的不允許改變的值，不過常量與變數還是有一些區別。

首先，不允許對常量使用 `mut`。常量不光默認不能變，它總是不能變。

聲明常量使用 `const` 關鍵字而不是 `let`，並且 *必須* 註明值的類型。在下一部分，[“數據類型”][data-types] 中會介紹類型和類型註解，現在無需關心這些細節，記住總是標註類型即可。

常量可以在任何作用域中聲明，包括全局作用域，這在一個值需要被很多部分的代碼用到時很有用。

最後一個區別是，常量只能被設置為常量表達式，而不能是函數調用的結果，或任何其他只能在運行時計算出的值。

這是一個聲明常量的例子，它的名稱是 `MAX_POINTS`，值是 100,000。（Rust 常量的命名規範是使用下劃線分隔的大寫字母單詞，並且可以在數字字面值中插入下劃線來提升可讀性）：

```rust
const MAX_POINTS: u32 = 100_000;
```

在聲明它的作用域之中，常量在整個程序生命週期中都有效，這使得常量可以作為多處代碼使用的全局範圍的值，例如一個遊戲中所有玩家可以獲取的最高分或者光速。

將遍布於應用程式中的寫死值聲明為常量，能幫助後來的代碼維護人員了解值的意圖。如果將來需要修改寫死值，也只需修改匯聚於一處的寫死值。

### 隱藏（Shadowing）

正如在第二章猜猜看遊戲的 [“比較猜測的數字和秘密數字”][comparing-the-guess-to-the-secret-number] 中所講，我們可以定義一個與之前變數同名的新變數，而新變數會 **隱藏** 之前的變數。Rustacean 們稱之為第一個變數被第二個 **隱藏** 了，這意味著使用這個變數時會看到第二個值。可以用相同變數名稱來隱藏一個變數，以及重複使用 `let` 關鍵字來多次隱藏，如下所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 5;

    let x = x + 1;

    let x = x * 2;

    println!("The value of x is: {}", x);
}
```

這個程序首先將 `x` 綁定到值 `5` 上。接著通過 `let x =` 隱藏 `x`，獲取初始值並加 `1`，這樣 `x` 的值就變成 `6` 了。第三個 `let` 語句也隱藏了 `x`，將之前的值乘以 `2`，`x` 最終的值是 `12`。運行這個程序，它會有如下輸出：

```text
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/variables`
The value of x is: 12
```

隱藏與將變數標記為 `mut` 是有區別的。當不小心嘗試對變數重新賦值時，如果沒有使用 `let` 關鍵字，就會導致編譯時錯誤。透過使用 `let`，我們可以用這個值進行一些計算，不過計算完之後變數仍然是不變的。

`mut` 與隱藏的另一個區別是，當再次使用 `let` 時，實際上創建了一個新變數，我們可以改變值的類型，但復用這個名字。例如，假設程序請求用戶輸入空格字元來說明希望在文本之間顯示多少個空格，然而我們真正需要的是將輸入存儲成數位（多少個空格）：

```rust
let spaces = "   ";
let spaces = spaces.len();
```

這裡允許第一個 `spaces` 變數是字串類型，而第二個 `spaces` 變數，它是一個恰巧與第一個變數同名的嶄新變數，是數字類型。隱藏使我們不必使用不同的名字，如 `spaces_str` 和 `spaces_num`；相反，我們可以復用 `spaces` 這個更簡單的名字。然而，如果嘗試使用 `mut`，將會得到一個編譯時錯誤，如下所示：

```rust,ignore,does_not_compile
let mut spaces = "   ";
spaces = spaces.len();
```

這個錯誤說明，我們不能改變變數的類型：

```text
error[E0308]: mismatched types
 --> src/main.rs:3:14
  |
3 |     spaces = spaces.len();
  |              ^^^^^^^^^^^^ expected &str, found usize
  |
  = note: expected type `&str`
             found type `usize`
```

現在我們已經了解了變數如何工作，讓我們看看變數可以擁有的更多數據類型。

[comparing-the-guess-to-the-secret-number]:ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[data-types]: ch03-02-data-types.html#data-types

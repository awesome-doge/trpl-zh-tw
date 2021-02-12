## 一個使用結構體的範例程序

> [ch05-02-example-structs.md](https://github.com/rust-lang/book/blob/master/src/ch05-02-example-structs.md)
> <br>
> commit 9cb1d20394f047855a57228dc4cbbabd0a9b395a

為了理解何時會需要使用結構體，讓我們編寫一個計算長方形面積的程序。我們會從單獨的變數開始，接著重構程序直到使用結構體替代他們為止。

使用 Cargo 新建一個叫做 *rectangles* 的二進位制程序，它獲取以像素為單位的長方形的寬度和高度，並計算出長方形的面積。範例 5-8 顯示了位於項目的 *src/main.rs* 中的小程序，它剛剛好實現此功能：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

<span class="caption">範例 5-8：透過分別指定長方形的寬和高的變數來計算長方形面積</span>

現在使用 `cargo run` 運行程序：

```text
The area of the rectangle is 1500 square pixels.
```

雖然範例 5-8 可以運行，並在調用 `area` 函數時傳入每個維度來計算出長方形的面積，不過我們可以做的更好。寬度和高度是相關聯的，因為他們在一起才能定義一個長方形。

這些程式碼的問題突顯在 `area` 的簽名上：

```rust,ignore
fn area(width: u32, height: u32) -> u32 {
```

函數 `area` 本應該計算一個長方形的面積，不過函數卻有兩個參數。這兩個參數是相關聯的，不過程序本身卻沒有表現出這一點。將長度和寬度組合在一起將更易懂也更易處理。第三章的 [“元組類型”][the-tuple-type] 部分已經討論過了一種可行的方法：元組。

### 使用元組重構

範例 5-9 展示了使用元組的另一個程序版本。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square pixels.",
        area(rect1)
    );
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

<span class="caption">範例 5-9：使用元組來指定長方形的寬高</span>

在某種程度上說，這個程序更好一點了。元組幫助我們增加了一些結構性，並且現在只需傳一個參數。不過在另一方面，這個版本卻有一點不明確了：元組並沒有給出元素的名稱，所以計算變得更費解了，因為不得不使用索引來獲取元組的每一部分：

在計算面積時將寬和高弄混倒無關緊要，不過當在螢幕上繪製長方形時就有問題了！我們必須牢記 `width` 的元組索引是 `0`，`height` 的元組索引是 `1`。如果其他人要使用這些程式碼，他們必須要搞清楚這一點，並也要牢記於心。很容易忘記或者混淆這些值而造成錯誤，因為我們沒有在代碼中傳達數據的意圖。

### 使用結構體重構：賦予更多意義

我們使用結構體為數據命名來為其賦予意義。我們可以將我們正在使用的元組轉換成一個有整體名稱而且每個部分也有對應名字的數據類型，如範例 5-10 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    );
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

<span class="caption">範例 5-10：定義 `Rectangle` 結構體</span>

這裡我們定義了一個結構體並稱其為 `Rectangle`。在大括號中定義了欄位 `width` 和 `height`，類型都是 `u32`。接著在 `main` 中，我們創建了一個具體的 `Rectangle` 實例，它的寬是 30，高是 50。

函數 `area` 現在被定義為接收一個名叫 `rectangle` 的參數，其類型是一個結構體 `Rectangle` 實例的不可變借用。第四章講到過，我們希望借用結構體而不是獲取它的所有權，這樣 `main` 函數就可以保持 `rect1` 的所有權並繼續使用它，所以這就是為什麼在函數簽名和調用的地方會有 `&`。

`area` 函數訪問 `Rectangle` 實例的 `width` 和 `height` 欄位。`area` 的函數簽名現在明確的闡述了我們的意圖：使用 `Rectangle` 的 `width` 和 `height` 欄位，計算 `Rectangle` 的面積。這表明寬高是相互聯繫的，並為這些值提供了描述性的名稱而不是使用元組的索引值 `0` 和 `1` 。結構體勝在更清晰明了。

### 通過派生 trait 增加實用功能

如果能夠在除錯程序時列印出 `Rectangle` 實例來查看其所有欄位的值就更好了。範例 5-11 像前面章節那樣嘗試使用 `println!` 宏。但這並不行。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!("rect1 is {}", rect1);
}
```

<span class="caption">範例 5-11：嘗試列印出 `Rectangle` 實例</span>

當我們運行這個代碼時，會出現帶有如下核心訊息的錯誤：

```text
error[E0277]: `Rectangle` doesn't implement `std::fmt::Display`
```

`println!` 宏能處理很多類型的格式，不過，`{}` 默認告訴 `println!` 使用被稱為 `Display` 的格式：意在提供給直接終端用戶查看的輸出。目前為止見過的基本類型都默認實現了 `Display`，因為它就是向用戶展示 `1` 或其他任何基本類型的唯一方式。不過對於結構體，`println!` 應該用來輸出的格式是不明確的，因為這有更多顯示的可能性：是否需要逗號？需要列印出大括號嗎？所有欄位都應該顯示嗎？由於這種不確定性，Rust 不會嘗試猜測我們的意圖，所以結構體並沒有提供一個 `Display` 實現。

但是如果我們繼續閱讀錯誤，將會發現這個有幫助的訊息：

```text
= help: the trait `std::fmt::Display` is not implemented for `Rectangle`
= note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

讓我們來試試！現在 `println!` 宏調用看起來像 `println!("rect1 is {:?}", rect1);` 這樣。在 `{}` 中加入 `:?` 指示符告訴 `println!` 我們想要使用叫做 `Debug` 的輸出格式。`Debug` 是一個 trait，它允許我們以一種對開發者有幫助的方式列印結構體，以便當我們除錯代碼時能看到它的值。

這樣調整後再次運行程序。見鬼了！仍然能看到一個錯誤：

```text
error[E0277]: `Rectangle` doesn't implement `std::fmt::Debug`
```

不過編譯器又一次給出了一個有幫助的訊息：

```text
= help: the trait `std::fmt::Debug` is not implemented for `Rectangle`
= note: add `#[derive(Debug)]` or manually implement `std::fmt::Debug`
```

Rust **確實** 包含了列印出除錯訊息的功能，不過我們必須為結構體顯式選擇這個功能。為此，在結構體定義之前加上 `#[derive(Debug)]` 註解，如範例 5-12 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!("rect1 is {:?}", rect1);
}
```

<span class="caption">範例 5-12：增加註解來派生 `Debug` trait，並使用除錯格式列印 `Rectangle` 實例</span>

現在我們再運行這個程序時，就不會有任何錯誤，並會出現如下輸出：

```text
rect1 is Rectangle { width: 30, height: 50 }
```

好極了！這並不是最漂亮的輸出，不過它顯示這個實例的所有欄位，毫無疑問這對除錯有幫助。當我們有一個更大的結構體時，能有更易讀一點的輸出就好了，為此可以使用 `{:#?}` 替換 `println!` 字串中的 `{:?}`。如果在這個例子中使用了 `{:#?}` 風格的話，輸出會看起來像這樣：

```text
rect1 is Rectangle {
    width: 30,
    height: 50
}
```

Rust 為我們提供了很多可以通過 `derive` 註解來使用的 trait，他們可以為我們的自訂類型增加實用的行為。附錄 C 中列出了這些 trait 和行為。第十章會介紹如何透過自訂行為來實現這些 trait，同時還有如何創建你自己的 trait。

我們的 `area` 函數是非常特殊的，它只計算長方形的面積。如果這個行為與 `Rectangle` 結構體再結合得更緊密一些就更好了，因為它不能用於其他類型。現在讓我們看看如何繼續重構這些程式碼，來將 `area` 函數協調進 `Rectangle` 類型定義的 `area` **方法** 中。

[the-tuple-type]: ch03-02-data-types.html#the-tuple-type

## Slice 類型

> [ch04-03-slices.md](https://github.com/rust-lang/book/blob/master/src/ch04-03-slices.md)
> <br>
> commit 9fcebe6e1b0b5e842285015dbf093f97cd5b3803

另一個沒有所有權的數據類型是 *slice*。slice 允許你引用集合中一段連續的元素序列，而不用引用整個集合。

這裡有一個編程小習題：編寫一個函數，該函數接收一個字串，並返回在該字串中找到的第一個單詞。如果函數在該字串中並未找到空格，則整個字串就是一個單詞，所以應該返回整個字串。

讓我們考慮一下這個函數的簽名：

```rust,ignore
fn first_word(s: &String) -> ?
```

`first_word` 函數有一個參數 `&String`。因為我們不需要所有權，所以這沒有問題。不過應該返回什麼呢？我們並沒有一個真正獲取 **部分** 字串的辦法。不過，我們可以返回單詞結尾的索引。試試如範例 4-7 中的代碼。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}
```

<span class="caption">範例 4-7：`first_word` 函數返回 `String` 參數的一個位元組索引值</span>

因為需要逐個元素的檢查 `String` 中的值是否為空格，需要用 `as_bytes` 方法將 `String` 轉化為位元組數組：

```rust,ignore
let bytes = s.as_bytes();
```

接下來，使用 `iter` 方法在位元組數組上創建一個疊代器：

```rust,ignore
for (i, &item) in bytes.iter().enumerate() {
```

我們將在第十三章詳細討論疊代器。現在，只需知道 `iter` 方法返回集合中的每一個元素，而 `enumerate` 包裝了 `iter` 的結果，將這些元素作為元組的一部分來返回。`enumerate` 返回的元組中，第一個元素是索引，第二個元素是集合中元素的引用。這比我們自己計算索引要方便一些。

因為 `enumerate` 方法返回一個元組，我們可以使用模式來解構，就像 Rust 中其他任何地方所做的一樣。所以在 `for` 循環中，我們指定了一個模式，其中元組中的 `i` 是索引而元組中的 `&item` 是單個位元組。因為我們從 `.iter().enumerate()` 中獲取了集合元素的引用，所以模式中使用了 `&`。

在 `for` 循環中，我們透過位元組的字面值語法來尋找代表空格的位元組。如果找到了一個空格，返回它的位置。否則，使用 `s.len()` 返回字串的長度：

```rust,ignore
    if item == b' ' {
        return i;
    }
}

s.len()
```

現在有了一個找到字串中第一個單詞結尾索引的方法，不過這有一個問題。我們返回了一個獨立的 `usize`，不過它只在 `&String` 的上下文中才是一個有意義的數字。換句話說，因為它是一個與 `String` 相分離的值，無法保證將來它仍然有效。考慮一下範例 4-8 中使用了範例 4-7 中 `first_word` 函數的程序。

<span class="filename">檔案名: src/main.rs</span>

```rust
# fn first_word(s: &String) -> usize {
#     let bytes = s.as_bytes();
#
#     for (i, &item) in bytes.iter().enumerate() {
#         if item == b' ' {
#             return i;
#         }
#     }
#
#     s.len()
# }
#
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s); // word 的值為 5

    s.clear(); // 這清空了字串，使其等於 ""

    // word 在此處的值仍然是 5，
    // 但是沒有更多的字串讓我們可以有效地應用數值 5。word 的值現在完全無效！
}
```

<span class="caption">範例 4-8：存儲 `first_word` 函數調用的返回值並接著改變 `String` 的內容</span>

這個程序編譯時沒有任何錯誤，而且在調用 `s.clear()` 之後使用 `word` 也不會出錯。因為 `word` 與 `s` 狀態完全沒有聯繫，所以 `word ` 仍然包含值 `5`。可以嘗試用值 `5` 來提取變數 `s` 的第一個單詞，不過這是有 bug 的，因為在我們將 `5` 保存到 `word` 之後 `s` 的內容已經改變。

我們不得不時刻擔心 `word` 的索引與 `s` 中的數據不再同步，這很囉嗦且易出錯！如果編寫這麼一個 `second_word` 函數的話，管理索引這件事將更加容易出問題。它的簽名看起來像這樣：

```rust,ignore
fn second_word(s: &String) -> (usize, usize) {
```

現在我們要跟蹤一個開始索引 **和** 一個結尾索引，同時有了更多從數據的某個特定狀態計算而來的值，但都完全沒有與這個狀態相關聯。現在有三個飄忽不定的不相關變數需要保持同步。

幸運的是，Rust 為這個問題提供了一個解決方法：字串 slice。

### 字串 slice

**字串 slice**（*string slice*）是 `String` 中一部分值的引用，它看起來像這樣：

```rust
let s = String::from("hello world");

let hello = &s[0..5];
let world = &s[6..11];
```

這類似於引用整個 `String` 不過帶有額外的 `[0..5]` 部分。它不是對整個 `String` 的引用，而是對部分 `String` 的引用。

可以使用一個由中括號中的 `[starting_index..ending_index]` 指定的 range 創建一個 slice，其中 `starting_index` 是 slice 的第一個位置，`ending_index` 則是 slice 最後一個位置的後一個值。在其內部，slice 的數據結構存儲了 slice 的開始位置和長度，長度對應於 `ending_index` 減去 `starting_index` 的值。所以對於 `let world = &s[6..11];` 的情況，`world` 將是一個包含指向 `s` 第 7 個位元組（從 1 開始）的指針和長度值 5 的 slice。

圖 4-6 展示了一個圖例。

<img alt="world containing a pointer to the 6th byte of String s and a length 5" src="img/trpl04-06.svg" class="center" style="width: 50%;" />

<span class="caption">圖 4-6：引用了部分 `String` 的字串 slice</span>

對於 Rust 的 `..` range 語法，如果想要從第一個索引（0）開始，可以不寫兩個點號之前的值。換句話說，如下兩個語句是相同的：

```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```

依此類推，如果 slice 包含 `String` 的最後一個位元組，也可以捨棄尾部的數字。這意味著如下也是相同的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[3..len];
let slice = &s[3..];
```

也可以同時捨棄這兩個值來獲取整個字串的 slice。所以如下亦是相同的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &s[..];
```

> 注意：字串 slice range 的索引必須位於有效的 UTF-8 字元邊界內，如果嘗試從一個多位元組字元的中間位置創建字串 slice，則程序將會因錯誤而退出。出於介紹字串 slice 的目的，本部分假設只使用 ASCII 字元集；第八章的 [“使用字串存儲 UTF-8 編碼的文本”][strings] 部分會更加全面的討論 UTF-8 處理問題。

在記住所有這些知識後，讓我們重寫 `first_word` 來返回一個 slice。“字串 slice” 的類型聲明寫作 `&str`：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

我們使用跟範例 4-7 相同的方式獲取單詞結尾的索引，通過尋找第一個出現的空格。當找到一個空格，我們返回一個字串 slice，它使用字串的開始和空格的索引作為開始和結束的索引。

現在當調用 `first_word` 時，會返回與底層數據關聯的單個值。這個值由一個 slice 開始位置的引用和 slice 中元素的數量組成。

`second_word` 函數也可以改為返回一個 slice：

```rust,ignore
fn second_word(s: &String) -> &str {
```

現在我們有了一個不易混淆且直觀的 API 了，因為編譯器會確保指向 `String` 的引用持續有效。還記得範例 4-8 程序中，那個當我們獲取第一個單詞結尾的索引後，接著就清除了字串導致索引就無效的 bug 嗎？那些程式碼在邏輯上是不正確的，但卻沒有顯示任何直接的錯誤。問題會在之後嘗試對空字串使用第一個單詞的索引時出現。slice 就不可能出現這種 bug 並讓我們更早的知道出問題了。使用 slice 版本的 `first_word` 會拋出一個編譯時錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s);

    s.clear(); // 錯誤!

    println!("the first word is: {}", word);
}
```

這裡是編譯錯誤：

```text
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
  --> src/main.rs:18:5
   |
16 |     let word = first_word(&s);
   |                           -- immutable borrow occurs here
17 |
18 |     s.clear(); // error!
   |     ^^^^^^^^^ mutable borrow occurs here
19 |
20 |     println!("the first word is: {}", word);
   |                                       ---- immutable borrow later used here
```

回憶一下借用規則，當擁有某值的不可變引用時，就不能再獲取一個可變引用。因為 `clear` 需要清空 `String`，它嘗試獲取一個可變引用。Rust不允許這樣做，因而編譯失敗。Rust 不僅使得我們的 API 簡單易用，也在編譯時就消除了一整類的錯誤！

#### 字串字面值就是 slice

還記得我們講到過字串字面值被儲存在二進位制文件中嗎？現在知道 slice 了，我們就可以正確地理解字串字面值了：

```rust
let s = "Hello, world!";
```

這裡 `s` 的類型是 `&str`：它是一個指向二進位制程序特定位置的 slice。這也就是為什麼字串字面值是不可變的；`&str` 是一個不可變引用。

#### 字串 slice 作為參數

在知道了能夠獲取字面值和 `String` 的 slice 後，我們對 `first_word` 做了改進，這是它的簽名：

```rust,ignore
fn first_word(s: &String) -> &str {
```

而更有經驗的 Rustacean 會編寫出範例 4-9 中的簽名，因為它使得可以對 `String` 值和 `&str` 值使用相同的函數：

```rust,ignore
fn first_word(s: &str) -> &str {
```

<span class="caption">範例 4-9: 透過將 `s` 參數的類型改為字串 slice 來改進 `first_word` 函數</span>

如果有一個字串 slice，可以直接傳遞它。如果有一個 `String`，則可以傳遞整個 `String` 的 slice。定義一個獲取字串 slice 而不是 `String` 引用的函數使得我們的 API 更加通用並且不會遺失任何功能：

<span class="filename">檔案名: src/main.rs</span>

```rust
# fn first_word(s: &str) -> &str {
#     let bytes = s.as_bytes();
#
#     for (i, &item) in bytes.iter().enumerate() {
#         if item == b' ' {
#             return &s[0..i];
#         }
#     }
#
#     &s[..]
# }
fn main() {
    let my_string = String::from("hello world");

    // first_word 中傳入 `String` 的 slice
    let word = first_word(&my_string[..]);

    let my_string_literal = "hello world";

    // first_word 中傳入字串字面值的 slice
    let word = first_word(&my_string_literal[..]);

    // 因為字串字面值 **就是** 字串 slice，
    // 這樣寫也可以，即不使用 slice 語法！
    let word = first_word(my_string_literal);
}
```

### 其他類型的 slice

字串 slice，正如你想像的那樣，是針對字串的。不過也有更通用的 slice 類型。考慮一下這個數組：

```rust
let a = [1, 2, 3, 4, 5];
```

就跟我們想要獲取字串的一部分那樣，我們也會想要引用數組的一部分。我們可以這樣做：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];
```

這個 slice 的類型是 `&[i32]`。它跟字串 slice 的工作方式一樣，透過存儲第一個集合元素的引用和一個集合總長度。你可以對其他所有集合使用這類 slice。第八章講到 vector 時會詳細討論這些集合。

## 總結

所有權、借用和 slice 這些概念讓 Rust 程序在編譯時確保記憶體安全。Rust 語言提供了跟其他系統程式語言相同的方式來控制你使用的記憶體，但擁有數據所有者在離開作用域後自動清除其數據的功能意味著你無須額外編寫和除錯相關的控制代碼。

所有權系統影響了 Rust 中很多其他部分的工作方式，所以我們還會繼續講到這些概念，這將貫穿本書的餘下內容。讓我們開始第五章，來看看如何將多份數據組合進一個 `struct` 中。

[strings]: ch08-02-strings.html#storing-utf-8-encoded-text-with-strings

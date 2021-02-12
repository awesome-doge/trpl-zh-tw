## 使用字串存儲 UTF-8 編碼的文本

> [ch08-02-strings.md](https://github.com/rust-lang/book/blob/master/src/ch08-02-strings.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

第四章已經講過一些字串的內容，不過現在讓我們更深入地了解它。字串是新晉 Rustacean 們通常會被困住的領域，這是由於三方面理由的結合：Rust 傾向於確保暴露出可能的錯誤，字串是比很多程式設計師所想像的要更為複雜的數據結構，以及 UTF-8。所有這些要素結合起來對於來自其他語言背景的程式設計師就可能顯得很困難了。

在集合章節中討論字串的原因是，字串就是作為位元組的集合外加一些方法實現的，當這些位元組被解釋為文本時，這些方法提供了實用的功能。在這一部分，我們會講到 `String` 中那些任何集合類型都有的操作，比如創建、更新和讀取。也會討論 `String` 與其他集合不一樣的地方，例如索引` String` 是很複雜的，由於人和計算機理解 `String` 數據方式的不同。

### 什麼是字串？

在開始深入這些方面之前，我們需要討論一下術語 **字串** 的具體意義。Rust 的核心語言中只有一種字串類型：`str`，字串 slice，它通常以被借用的形式出現，`&str`。第四章講到了 **字串 slice**：它們是一些儲存在別處的 UTF-8 編碼字串數據的引用。比如字串字面值被儲存在程序的二進位制輸出中，字串 slice 也是如此。

稱作 `String` 的類型是由標準庫提供的，而沒有寫進核心語言部分，它是可增長的、可變的、有所有權的、UTF-8 編碼的字串類型。當 Rustacean 們談到 Rust 的 “字串”時，它們通常指的是 `String` 和字串 slice `&str` 類型，而不僅僅是其中之一。雖然本部分內容大多是關於 `String` 的，不過這兩個類型在 Rust 標準庫中都被廣泛使用，`String` 和字串 slice 都是 UTF-8 編碼的。

Rust 標準庫中還包含一系列其他字串類型，比如 `OsString`、`OsStr`、`CString` 和 `CStr`。相關庫 crate 甚至會提供更多儲存字串數據的選擇。看到這些由 `String` 或是 `Str` 結尾的名字了嗎？這對應著它們提供的所有權和可借用的字串變體，就像是你之前看到的 `String` 和 `str`。舉例而言，這些字串類型能夠以不同的編碼，或者記憶體表現形式上以不同的形式，來存儲文本內容。本章將不會討論其他這些字串類型，更多有關如何使用它們以及各自適合的場景，請參見其API文件。

### 新建字串

很多 `Vec` 可用的操作在 `String` 中同樣可用，從以 `new` 函數創建字串開始，如範例 8-11 所示。

```rust
let mut s = String::new();
```

<span class="caption">範例 8-11：新建一個空的 `String`</span>

這新建了一個叫做 `s` 的空的字串，接著我們可以向其中裝載數據。通常字串會有初始數據，因為我們希望一開始就有這個字串。為此，可以使用 `to_string` 方法，它能用於任何實現了 `Display` trait 的類型，字串字面值也實現了它。範例 8-12 展示了兩個例子。

```rust
let data = "initial contents";

let s = data.to_string();

// 該方法也可直接用於字串字面值：
let s = "initial contents".to_string();
```

<span class="caption">範例 8-12：使用 `to_string` 方法從字串字面值創建 `String`</span>

這些程式碼會創建包含 `initial contents` 的字串。

也可以使用 `String::from` 函數來從字串字面值創建 `String`。範例 8-13 中的代碼代碼等同於使用 `to_string`。

```rust
let s = String::from("initial contents");
```

<span class="caption">範例 8-13：使用 `String::from` 函數從字串字面值創建 `String`</span>

因為字串應用廣泛，這裡有很多不同的用於字串的通用 API 可供選擇。其中一些可能看起來多餘，不過都有其用武之地！在這個例子中，`String::from` 和 `.to_string` 最終做了完全相同的工作，所以如何選擇就是風格問題了。

記住字串是 UTF-8 編碼的，所以可以包含任何可以正確編碼的數據，如範例 8-14 所示。

```rust
let hello = String::from("السلام عليكم");
let hello = String::from("Dobrý den");
let hello = String::from("Hello");
let hello = String::from("שָׁלוֹם");
let hello = String::from("नमस्ते");
let hello = String::from("こんにちは");
let hello = String::from("안녕하세요");
let hello = String::from("你好");
let hello = String::from("Olá");
let hello = String::from("Здравствуйте");
let hello = String::from("Hola");
```

<span class="caption">範例 8-14：在字串中儲存不同語言的問候語</span>

所有這些都是有效的 `String` 值。

### 更新字串

`String` 的大小可以增加，其內容也可以改變，就像可以放入更多數據來改變 `Vec` 的內容一樣。另外，可以方便的使用 `+` 運算符或 `format!` 宏來拼接 `String` 值。

#### 使用 `push_str` 和 `push` 附加字串

可以通過 `push_str` 方法來附加字串 slice，從而使 `String` 變長，如範例 8-15 所示。

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

<span class="caption">範例 8-15：使用 `push_str` 方法向 `String` 附加字串 slice</span>

執行這兩行程式碼之後，`s` 將會包含 `foobar`。`push_str` 方法採用字串 slice，因為我們並不需要獲取參數的所有權。例如，範例 8-16 展示了如果將 `s2` 的內容附加到 `s1` 之後，自身不能被使用就糟糕了。

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {}", s2);
```

<span class="caption">範例 8-16：將字串 slice 的內容附加到 `String` 後使用它</span>

如果 `push_str` 方法獲取了 `s2` 的所有權，就不能在最後一行列印出其值了。好在代碼如我們期望那樣工作！

`push` 方法被定義為獲取一個單獨的字元作為參數，並附加到 `String` 中。範例 8-17 展示了使用 `push` 方法將字母 *l* 加入 `String` 的代碼。

```rust
let mut s = String::from("lo");
s.push('l');
```

<span class="caption">範例 8-17：使用 `push` 將一個字元加入 `String` 值中</span>

執行這些程式碼之後，`s` 將會包含 “lol”。

#### 使用 `+` 運算符或 `format!` 宏拼接字串

通常你會希望將兩個已知的字串合併在一起。一種辦法是像這樣使用 `+` 運算符，如範例 8-18 所示。

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 被移動了，不能繼續使用
```

<span class="caption">範例 8-18：使用 `+` 運算符將兩個 `String` 值合併到一個新的 `String` 值中</span>

執行完這些程式碼之後，字串 `s3` 將會包含 `Hello, world!`。`s1` 在相加後不再有效的原因，和使用 `s2` 的引用的原因，與使用 `+` 運算符時調用的函數簽名有關。`+` 運算符使用了 `add` 函數，這個函數簽名看起來像這樣：

```rust,ignore
fn add(self, s: &str) -> String {
```

這並不是標準庫中實際的簽名；標準庫中的 `add` 使用泛型定義。這裡我們看到的 `add` 的簽名使用具體類型代替了泛型，這也正是當使用 `String` 值調用這個方法會發生的。第十章會討論泛型。這個簽名提供了理解 `+` 運算那微妙部分的線索。

首先，`s2` 使用了 `&`，意味著我們使用第二個字串的 **引用** 與第一個字串相加。這是因為 `add` 函數的 `s` 參數：只能將 `&str` 和 `String` 相加，不能將兩個 `String` 值相加。不過等一下 —— 正如 `add` 的第二個參數所指定的，`&s2` 的類型是 `&String` 而不是 `&str`。那麼為什麼範例 8-18 還能編譯呢？

之所以能夠在 `add` 調用中使用 `&s2` 是因為 `&String` 可以被 **強轉**（*coerced*）成 `&str`。當`add`函數被調用時，Rust 使用了一個被稱為 **解引用強制多態**（*deref coercion*）的技術，你可以將其理解為它把 `&s2` 變成了 `&s2[..]`。第十五章會更深入的討論解引用強制多態。因為 `add` 沒有獲取參數的所有權，所以 `s2` 在這個操作後仍然是有效的 `String`。

其次，可以發現簽名中 `add` 獲取了 `self` 的所有權，因為 `self` **沒有** 使用 `&`。這意味著範例 8-18 中的 `s1` 的所有權將被移動到 `add` 調用中，之後就不再有效。所以雖然 `let s3 = s1 + &s2;` 看起來就像它會複製兩個字串並創建一個新的字串，而實際上這個語句會獲取 `s1` 的所有權，附加上從 `s2` 中拷貝的內容，並返回結果的所有權。換句話說，它看起來好像生成了很多拷貝，不過實際上並沒有：這個實現比拷貝要更高效。

如果想要級聯多個字串，`+` 的行為就顯得笨重了：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = s1 + "-" + &s2 + "-" + &s3;
```

這時 `s` 的內容會是 “tic-tac-toe”。在有這麼多 `+` 和 `"` 字元的情況下，很難理解具體發生了什麼事。對於更為複雜的字串連結，可以使用 `format!` 宏：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```

這些程式碼也會將 `s` 設置為 “tic-tac-toe”。`format!` 與 `println!` 的工作原理相同，不過不同於將輸出列印到螢幕上，它返回一個帶有結果內容的 `String`。這個版本就好理解的多，並且不會獲取任何參數的所有權。

### 索引字串

在很多語言中，透過索引來引用字串中的單獨字元是有效且常見的操作。然而在 Rust 中，如果你嘗試使用索引語法訪問 `String` 的一部分，會出現一個錯誤。考慮一下如範例 8-19 中所示的無效代碼。

```rust,ignore,does_not_compile
let s1 = String::from("hello");
let h = s1[0];
```

<span class="caption">範例 8-19：嘗試對字串使用索引語法</span>

這段代碼會導致如下錯誤：

```text
error[E0277]: the trait bound `std::string::String: std::ops::Index<{integer}>` is not satisfied
 -->
  |
3 |     let h = s1[0];
  |             ^^^^^ the type `std::string::String` cannot be indexed by `{integer}`
  |
  = help: the trait `std::ops::Index<{integer}>` is not implemented for `std::string::String`
```

錯誤和提示說明了全部問題：Rust 的字串不支持索引。那麼接下來的問題是，為什麼不支持呢？為了回答這個問題，我們必須先聊一聊 Rust 是如何在記憶體中儲存字串的。

#### 內部表現

`String` 是一個 `Vec<u8>` 的封裝。讓我們看看範例 8-14 中一些正確編碼的字串的例子。首先是這一個：

```rust
let len = String::from("Hola").len();
```

在這裡，`len` 的值是 4 ，這意味著儲存字串 “Hola” 的 `Vec` 的長度是四個位元組：這裡每一個字母的 UTF-8 編碼都占用一個位元組。那下面這個例子又如何呢？（注意這個字串中的首字母是西里爾字母的 Ze 而不是阿拉伯數字 3 。）

```rust
let len = String::from("Здравствуйте").len();
```

當問及這個字元是多長的時候有人可能會說是 12。然而，Rust 的回答是 24。這是使用 UTF-8 編碼 “Здравствуйте” 所需要的位元組數，這是因為每個 Unicode 標量值需要兩個位元組存儲。因此一個字串位元組值的索引並不總是對應一個有效的 Unicode 標量值。作為示範，考慮如下無效的 Rust 代碼：

```rust,ignore,does_not_compile
let hello = "Здравствуйте";
let answer = &hello[0];
```

`answer` 的值應該是什麼呢？它應該是第一個字元 `З` 嗎？當使用 UTF-8 編碼時，`З` 的第一個位元組 `208`，第二個是 `151`，所以 `answer` 實際上應該是 `208`，不過 `208` 自身並不是一個有效的字母。返回 `208` 可不是一個請求字串第一個字母的人所希望看到的，不過它是 Rust 在位元組索引 0 位置所能提供的唯一數據。用戶通常不會想要一個位元組值被返回，即便這個字串只有拉丁字母： 即便 `&"hello"[0]` 是返回位元組值的有效代碼，它也應當返回 `104` 而不是 `h`。為了避免返回意外的值並造成不能立刻發現的 bug，Rust 根本不會編譯這些程式碼，並在開發過程中及早杜絕了誤會的發生。

#### 位元組、標量值和字形簇！天啊！

這引起了關於 UTF-8 的另外一個問題：從 Rust 的角度來講，事實上有三種相關方式可以理解字串：位元組、標量值和字形簇（最接近人們眼中 **字母** 的概念）。

比如這個用梵文書寫的印度語單詞 “नमस्ते”，最終它儲存在 vector 中的 `u8` 值看起來像這樣：

```text
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]
```

這裡有 18 個位元組，也就是計算機最終會儲存的數據。如果從 Unicode 標量值的角度理解它們，也就像 Rust 的 `char` 類型那樣，這些位元組看起來像這樣：

```text
['न', 'म', 'स', '्', 'त', 'े']
```

這裡有六個 `char`，不過第四個和第六個都不是字母，它們是發音符號本身並沒有任何意義。最後，如果以字形簇的角度理解，就會得到人們所說的構成這個單詞的四個字母：

```text
["न", "म", "स्", "ते"]
```

Rust 提供了多種不同的方式來解釋計算機儲存的原始字串數據，這樣程序就可以選擇它需要的表現方式，而無所謂是何種人類語言。

最後一個 Rust 不允許使用索引獲取 `String` 字元的原因是，索引操作預期總是需要常數時間 (O(1))。但是對於 `String` 不可能保證這樣的性能，因為 Rust 必須從開頭到索引位置遍歷來確定有多少有效的字元。

### 字串 slice

索引字串通常是一個壞點子，因為字串索引應該返回的類型是不明確的：位元組值、字元、字形簇或者字串 slice。因此，如果你真的希望使用索引創建字串 slice 時，Rust 會要求你更明確一些。為了更明確索引並表明你需要一個字串 slice，相比使用 `[]` 和單個值的索引，可以使用 `[]` 和一個 range 來創建含特定位元組的字串 slice：

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

這裡，`s` 會是一個 `&str`，它包含字串的頭四個位元組。早些時候，我們提到了這些字母都是兩個位元組長的，所以這意味著 `s` 將會是 “Зд”。

如果獲取 `&hello[0..1]` 會發生什麼事呢？答案是：Rust 在運行時會 panic，就跟訪問 vector 中的無效索引時一樣：

```text
thread 'main' panicked at 'byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`', src/libcore/str/mod.rs:2188:4
```

你應該小心謹慎的使用這個操作，因為這麼做可能會使你的程序崩潰。

### 遍歷字串的方法

幸運的是，這裡還有其他獲取字串元素的方式。

如果你需要操作單獨的 Unicode 標量值，最好的選擇是使用 `chars` 方法。對 “नमस्ते” 調用 `chars` 方法會將其分開並返回六個 `char` 類型的值，接著就可以遍歷其結果來訪問每一個元素了：

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

這些程式碼會列印出如下內容：

```text
न
म
स
्
त
े
```

`bytes` 方法返回每一個原始位元組，這可能會適合你的使用場景：

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

這些程式碼會列印出組成 `String` 的 18 個位元組：

```text
224
164
// --snip--
165
135
```

不過請記住有效的 Unicode 標量值可能會由不止一個位元組組成。

從字串中獲取字形簇是很複雜的，所以標準庫並沒有提供這個功能。[crates.io](https://crates.io) 上有些提供這樣功能的 crate。

### 字串並不簡單

總而言之，字串還是很複雜的。不同的語言選擇了不同的向程式設計師展示其複雜性的方式。Rust 選擇了以準確的方式處理 `String` 數據作為所有 Rust 程序的默認行為，這意味著程式設計師們必須更多的思考如何預先處理 UTF-8 數據。這種權衡取捨相比其他語言更多的暴露出了字串的複雜性，不過也使你在開發生命週期後期免於處理涉及非 ASCII 字元的錯誤。

現在讓我們轉向一些不太複雜的集合：哈希 map！

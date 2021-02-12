## 哈希 map 儲存鍵值對

> [ch08-03-hash-maps.md](https://github.com/rust-lang/book/blob/master/src/ch08-03-hash-maps.md)
> <br>
> commit 85b02530cc749565c26c05bf1b3a838334e9717f

最後介紹的常用集合類型是 **哈希 map**（*hash map*）。`HashMap<K, V>` 類型儲存了一個鍵類型 `K` 對應一個值類型 `V` 的映射。它通過一個 **哈希函數**（*hashing function*）來實現映射，決定如何將鍵和值放入記憶體中。很多程式語言支持這種數據結構，不過通常有不同的名字：哈希、map、對象、哈希表或者關聯數組，僅舉幾例。

哈希 map 可以用於需要任何類型作為鍵來尋找數據的情況，而不是像 vector 那樣通過索引。例如，在一個遊戲中，你可以將每個團隊的分數記錄到哈希 map 中，其中鍵是隊伍的名字而值是每個隊伍的分數。給出一個隊名，就能得到他們的得分。

本章我們會介紹哈希 map 的基本 API，不過還有更多吸引人的功能隱藏於標準庫在 `HashMap<K, V>` 上定義的函數中。一如既往請查看標準庫文件來了解更多訊息。

### 新建一個哈希 map

可以使用 `new` 創建一個空的 `HashMap`，並使用 `insert` 增加元素。在範例 8-20 中我們記錄兩支隊伍的分數，分別是藍隊和黃隊。藍隊開始有 10 分而黃隊開始有 50 分：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

<span class="caption">範例 8-20：新建一個哈希 map 並插入一些鍵值對</span>

注意必須首先 `use` 標準庫中集合部分的 `HashMap`。在這三個常用集合中，`HashMap` 是最不常用的，所以並沒有被 prelude 自動引用。標準庫中對 `HashMap` 的支持也相對較少，例如，並沒有內建的構建宏。

像 vector 一樣，哈希 map 將它們的數據儲存在堆上，這個 `HashMap` 的鍵類型是 `String` 而值類型是 `i32`。類似於 vector，哈希 map 是同質的：所有的鍵必須是相同類型，值也必須都是相同類型。

另一個構建哈希 map 的方法是使用一個元組的 vector 的 `collect` 方法，其中每個元組包含一個鍵值對。`collect` 方法可以將數據收集進一系列的集合類型，包括 `HashMap`。例如，如果隊伍的名字和初始分數分別在兩個 vector 中，可以使用 `zip` 方法來創建一個元組的 vector，其中 “Blue” 與 10 是一對，依此類推。接著就可以使用 `collect` 方法將這個元組 vector 轉換成一個 `HashMap`，如範例 8-21 所示：

```rust
use std::collections::HashMap;

let teams  = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let scores: HashMap<_, _> = teams.iter().zip(initial_scores.iter()).collect();
```

<span class="caption">範例 8-21：用隊伍列表和分數列表創建哈希 map</span>

這裡 `HashMap<_, _>` 類型註解是必要的，因為可能 `collect` 很多不同的數據結構，而除非顯式指定否則 Rust 無從得知你需要的類型。但是對於鍵和值的類型參數來說，可以使用下劃線占位，而 Rust 能夠根據 vector 中數據的類型推斷出 `HashMap` 所包含的類型。

### 哈希 map 和所有權

對於像 `i32` 這樣的實現了 `Copy` trait 的類型，其值可以拷貝進哈希 map。對於像 `String` 這樣擁有所有權的值，其值將被移動而哈希 map 會成為這些值的所有者，如範例 8-22 所示：

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);
// 這裡 field_name 和 field_value 不再有效，
// 嘗試使用它們看看會出現什麼編譯錯誤！
```

<span class="caption">範例 8-22：展示一旦鍵值對被插入後就為哈希 map 所擁有</span>

當 `insert` 調用將 `field_name` 和 `field_value` 移動到哈希 map 中後，將不能使用這兩個綁定。

如果將值的引用插入哈希 map，這些值本身將不會被移動進哈希 map。但是這些引用指向的值必須至少在哈希 map 有效時也是有效的。第十章 [“生命週期與引用有效性”][validating-references-with-lifetimes] 部分將會更多的討論這個問題。

### 訪問哈希 map 中的值

可以通過 `get` 方法並提供對應的鍵來從哈希 map 中獲取值，如範例 8-23 所示：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);
```

<span class="caption">範例 8-23：訪問哈希 map 中儲存的藍隊分數</span>

這裡，`score` 是與藍隊分數相關的值，應為 `Some(10)`。因為 `get` 返回 `Option<V>`，所以結果被裝進 `Some`；如果某個鍵在哈希 map 中沒有對應的值，`get` 會返回 `None`。這時就要用某種第六章提到的方法之一來處理 `Option`。

可以使用與 vector 類似的方式來遍歷哈希 map 中的每一個鍵值對，也就是 `for` 循環：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{}: {}", key, value);
}
```

這會以任意順序列印出每一個鍵值對：

```text
Yellow: 50
Blue: 10
```

### 更新哈希 map

儘管鍵值對的數量是可以增長的，不過任何時候，每個鍵只能關聯一個值。當我們想要改變哈希 map 中的數據時，必須決定如何處理一個鍵已經有值了的情況。可以選擇完全無視舊值並用新值代替舊值。可以選擇保留舊值而忽略新值，並只在鍵 **沒有** 對應值時增加新值。或者可以結合新舊兩值。讓我們看看這分別該如何處理！

#### 覆蓋一個值

如果我們插入了一個鍵值對，接著用相同的鍵插入一個不同的值，與這個鍵相關聯的舊值將被替換。即便範例 8-24 中的代碼調用了兩次 `insert`，哈希 map 也只會包含一個鍵值對，因為兩次都是對藍隊的鍵插入的值：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);

println!("{:?}", scores);
```

<span class="caption">範例 8-24：替換以特定鍵儲存的值</span>

這會列印出 `{"Blue": 25}`。原始的值 `10` 則被覆蓋了。

#### 只在鍵沒有對應值時插入

我們經常會檢查某個特定的鍵是否有值，如果沒有就插入一個值。為此哈希 map 有一個特有的 API，叫做 `entry`，它獲取我們想要檢查的鍵作為參數。`entry` 函數的返回值是一個枚舉，`Entry`，它代表了可能存在也可能不存在的值。比如說我們想要檢查黃隊的鍵是否關聯了一個值。如果沒有，就插入值 50，對於藍隊也是如此。使用 entry API 的代碼看起來像範例 8-25 這樣：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{:?}", scores);
```

<span class="caption">範例 8-25：使用 `entry` 方法只在鍵沒有對應一個值時插入</span>

`Entry` 的 `or_insert` 方法在鍵對應的值存在時就返回這個值的可變引用，如果不存在則將參數作為新值插入並返回新值的可變引用。這比編寫自己的邏輯要簡明的多，另外也與借用檢查器結合得更好。

運行範例 8-25 的代碼會列印出 `{"Yellow": 50, "Blue": 10}`。第一個 `entry` 調用會插入黃隊的鍵和值 `50`，因為黃隊並沒有一個值。第二個 `entry` 調用不會改變哈希 map 因為藍隊已經有了值 `10`。

#### 根據舊值更新一個值

另一個常見的哈希 map 的應用場景是找到一個鍵對應的值並根據舊的值更新它。例如，範例 8-26 中的代碼計數一些文本中每一個單詞分別出現了多少次。我們使用哈希 map 以單詞作為鍵並遞增其值來記錄我們遇到過幾次這個單詞。如果是第一次看到某個單詞，就插入值 `0`。

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";

let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", map);
```

<span class="caption">範例 8-26：通過哈希 map 儲存單詞和計數來統計出現次數</span>

這會列印出 `{"world": 2, "hello": 1, "wonderful": 1}`，`or_insert` 方法事實上會返回這個鍵的值的一個可變引用（`&mut V`）。這裡我們將這個可變引用儲存在 `count` 變數中，所以為了賦值必須首先使用星號（`*`）解引用 `count`。這個可變引用在 `for` 循環的結尾離開作用域，這樣所有這些改變都是安全的並符合借用規則。

### 哈希函數

`HashMap` 預設使用一種 “密碼學安全的”（“cryptographically strong” ）[^siphash] 哈希函數，它可以抵抗拒絕服務（Denial of Service, DoS）攻擊。然而這並不是可用的最快的算法，不過為了更高的安全性值得付出一些性能的代價。如果性能監測顯示此哈希函數非常慢，以致於你無法接受，你可以指定一個不同的 *hasher* 來切換為其它函數。hasher 是一個實現了 `BuildHasher` trait 的類型。第十章會討論 trait 和如何實現它們。你並不需要從頭開始實現你自己的 hasher；[crates.io](https://crates.io) 有其他人分享的實現了許多常用哈希算法的 hasher 的庫。

[^siphash]: [https://www.131002.net/siphash/siphash.pdf](https://www.131002.net/siphash/siphash.pdf)

## 總結

vector、字串和哈希 map 會在你的程序需要儲存、訪問和修改數據時幫助你。這裡有一些你應該能夠解決的練習問題：

* 給定一系列數字，使用 vector 並返回這個列表的平均數（mean, average）、中位數（排列數組後位於中間的值）和眾數（mode，出現次數最多的值；這裡哈希函數會很有幫助）。
* 將字串轉換為 Pig Latin，也就是每一個單詞的第一個子音字母被移動到單詞的結尾並增加 “ay”，所以 “first” 會變成 “irst-fay”。母音字母開頭的單詞則在結尾增加  “hay”（“apple” 會變成 “apple-hay”）。牢記 UTF-8 編碼！
* 使用哈希 map 和 vector，創建一個文本介面來允許用戶向公司的部門中增加員工的名字。例如，“Add Sally to Engineering” 或 “Add Amir to Sales”。接著讓用戶獲取一個部門的所有員工的列表，或者公司每個部門的所有員工按照字典序排列的列表。

標準庫 API 文件中描述的這些類型的方法將有助於你進行這些練習！

我們已經開始接觸可能會有失敗操作的複雜程序了，這也意味著接下來是一個了解錯誤處理的絕佳時機！

[validating-references-with-lifetimes]:
ch10-03-lifetime-syntax.html#validating-references-with-lifetimes

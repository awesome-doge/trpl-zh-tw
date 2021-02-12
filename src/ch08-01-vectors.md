## vector 用來儲存一系列的值

> [ch08-01-vectors.md](https://github.com/rust-lang/book/blob/master/src/ch08-01-vectors.md)
> <br>
> commit 76df60bccead5f3de96db23d97b69597cd8a2b82

我們要講到的第一個類型是 `Vec<T>`，也被稱為 *vector*。vector 允許我們在一個單獨的數據結構中儲存多於一個的值，它在記憶體中彼此相鄰地排列所有的值。vector 只能儲存相同類型的值。它們在擁有一系列項的場景下非常實用，例如文件中的文本行或是購物車中商品的價格。

### 新建 vector

為了創建一個新的空 vector，可以調用 `Vec::new` 函數，如範例 8-1 所示：

```rust
let v: Vec<i32> = Vec::new();
```

<span class="caption">範例 8-1：新建一個空的 vector 來儲存 `i32` 類型的值</span>

注意這裡我們增加了一個類型註解。因為沒有向這個 vector 中插入任何值，Rust 並不知道我們想要儲存什麼類型的元素。這是一個非常重要的點。vector 是用泛型實現的，第十章會涉及到如何對你自己的類型使用它們。現在，所有你需要知道的就是 `Vec` 是一個由標準庫提供的類型，它可以存放任何類型，而當 `Vec` 存放某個特定類型時，那個類型位於角括號中。在範例 8-1 中，我們告訴 Rust `v` 這個 `Vec` 將存放 `i32` 類型的元素。

在更實際的代碼中，一旦插入值 Rust 就可以推斷出想要存放的類型，所以你很少會需要這些類型註解。更常見的做法是使用初始值來創建一個 `Vec`，而且為了方便 Rust 提供了 `vec!` 宏。這個宏會根據我們提供的值來創建一個新的 `Vec`。範例 8-2 新建一個擁有值 `1`、`2` 和 `3` 的 `Vec<i32>`：

```rust
let v = vec![1, 2, 3];
```

<span class="caption">範例 8-2：新建一個包含初值的 vector</span>

因為我們提供了 `i32` 類型的初始值，Rust 可以推斷出 `v` 的類型是 `Vec<i32>`，因此類型註解就不是必須的。接下來讓我們看看如何修改一個 vector。

### 更新 vector

對於新建一個 vector 並向其增加元素，可以使用 `push` 方法，如範例 8-3 所示：

```rust
let mut v = Vec::new();

v.push(5);
v.push(6);
v.push(7);
v.push(8);
```

<span class="caption">範例 8-3：使用 `push` 方法向 vector 增加值</span>

如第三章中討論的任何變數一樣，如果想要能夠改變它的值，必須使用 `mut` 關鍵字使其可變。放入其中的所有值都是 `i32` 類型的，而且 Rust 也根據數據做出如此判斷，所以不需要 `Vec<i32>` 註解。

### 丟棄 vector 時也會丟棄其所有元素

類似於任何其他的 `struct`，vector 在其離開作用域時會被釋放，如範例 8-4 所標註的：

```rust
{
    let v = vec![1, 2, 3, 4];

    // 處理變數 v

} // <- 這裡 v 離開作用域並被丟棄
```

<span class="caption">範例 8-4：展示 vector 和其元素於何處被丟棄</span>

當 vector 被丟棄時，所有其內容也會被丟棄，這意味著這裡它包含的整數將被清理。這可能看起來非常直觀，不過一旦開始使用 vector 元素的引用，情況就變得有些複雜了。下面讓我們處理這種情況！

### 讀取 vector 的元素

現在你知道如何創建、更新和銷毀 vector 了，接下來的一步最好了解一下如何讀取它們的內容。有兩種方法引用 vector 中儲存的值。為了更加清楚的說明這個例子，我們標註這些函數返回的值的類型。

範例 8-5 展示了訪問 vector 中一個值的兩種方式，索引語法或者 `get` 方法：

```rust
let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];
println!("The third element is {}", third);

match v.get(2) {
    Some(third) => println!("The third element is {}", third),
    None => println!("There is no third element."),
}
```

<span class="caption">列表 8-5：使用索引語法或 `get` 方法來訪問 vector 中的項</span>

這裡有兩個需要注意的地方。首先，我們使用索引值 `2` 來獲取第三個元素，索引是從 0 開始的。其次，這兩個不同的獲取第三個元素的方式分別為：使用 `&` 和 `[]` 返回一個引用；或者使用 `get` 方法以索引作為參數來返回一個 `Option<&T>`。

Rust 有兩個引用元素的方法的原因是程序可以選擇如何處理當索引值在 vector 中沒有對應值的情況。作為一個例子，讓我們看看如果有一個有五個元素的 vector 接著嘗試訪問索引為 100 的元素時程序會如何處理，如範例 8-6 所示：

```rust,should_panic,panics
let v = vec![1, 2, 3, 4, 5];

let does_not_exist = &v[100];
let does_not_exist = v.get(100);
```

<span class="caption">範例 8-6：嘗試訪問一個包含 5 個元素的 vector 的索引 100 處的元素</span>

當運行這段代碼，你會發現對於第一個 `[]` 方法，當引用一個不存在的元素時 Rust 會造成 panic。這個方法更適合當程序認為嘗試訪問超過 vector 結尾的元素是一個嚴重錯誤的情況，這時應該使程序崩潰。

當 `get` 方法被傳遞了一個數組外的索引時，它不會 panic 而是返回 `None`。當偶爾出現超過 vector 範圍的訪問屬於正常情況的時候可以考慮使用它。接著你的代碼可以有處理 `Some(&element)` 或 `None` 的邏輯，如第六章討論的那樣。例如，索引可能來源於用戶輸入的數字。如果它們不慎輸入了一個過大的數字那麼程序就會得到 `None` 值，你可以告訴用戶當前 vector 元素的數量並再請求它們輸入一個有效的值。這就比因為輸入錯誤而使程序崩潰要友好的多！

一旦程序獲取了一個有效的引用，借用檢查器將會執行所有權和借用規則（第四章講到）來確保 vector 內容的這個引用和任何其他引用保持有效。回憶一下不能在相同作用域中同時存在可變和不可變引用的規則。這個規則適用於範例 8-7，當我們獲取了 vector 的第一個元素的不可變引用並嘗試在 vector 末尾增加一個元素的時候，這是行不通的：

```rust,ignore,does_not_compile
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];

v.push(6);

println!("The first element is: {}", first);
```

<span class="caption">範例 8-7：在擁有 vector 中項的引用的同時向其增加一個元素</span>

編譯會給出這個錯誤：

```text
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:5
  |
4 |     let first = &v[0];
  |                  - immutable borrow occurs here
5 |
6 |     v.push(6);
  |     ^^^^^^^^^ mutable borrow occurs here
7 |
8 |     println!("The first element is: {}", first);
  |                                          ----- immutable borrow later used here
```

範例 8-7 中的代碼看起來應該能夠運行：為什麼第一個元素的引用會關心 vector 結尾的變化？不能這麼做的原因是由於 vector 的工作方式：在 vector 的結尾增加新元素時，在沒有足夠空間將所有所有元素依次相鄰存放的情況下，可能會要求分配新記憶體並將老的元素拷貝到新的空間中。這時，第一個元素的引用就指向了被釋放的記憶體。借用規則阻止程式陷入這種狀況。

> 注意：關於 `Vec<T>` 類型的更多實現細節，在 https://doc.rust-lang.org/stable/nomicon/vec.html 查看 “The Nomicon”

### 遍歷 vector 中的元素

如果想要依次訪問 vector 中的每一個元素，我們可以遍歷其所有的元素而無需通過索引一次一個的訪問。範例 8-8 展示了如何使用 `for` 循環來獲取 `i32` 值的 vector 中的每一個元素的不可變引用並將其列印：

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{}", i);
}
```

<span class="caption">範例 8-8：通過 `for` 循環遍歷 vector 的元素並列印</span>

我們也可以遍歷可變 vector 的每一個元素的可變引用以便能改變他們。範例 8-9 中的 `for` 循環會給每一個元素加 `50`：

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50;
}
```

<span class="caption">範例8-9：遍歷 vector 中元素的可變引用</span>

為了修改可變引用所指向的值，在使用 `+=` 運算符之前必須使用解引用運算符（`*`）獲取 `i` 中的值。第十五章的 [“透過解引用運算符追蹤指針的值”][deref] 部分會詳細介紹解引用運算符。

### 使用枚舉來儲存多種類型

在本章的開始，我們提到 vector 只能儲存相同類型的值。這是很不方便的；絕對會有需要儲存一系列不同類型的值的用例。幸運的是，枚舉的成員都被定義為相同的枚舉類型，所以當需要在 vector 中儲存不同類型值時，我們可以定義並使用一個枚舉！

例如，假如我們想要從電子表格的一行中獲取值，而這一行的有些列包含數字，有些包含浮點值，還有些是字串。我們可以定義一個枚舉，其成員會存放這些不同類型的值，同時所有這些枚舉成員都會被當作相同類型，那個枚舉的類型。接著可以創建一個儲存枚舉值的 vector，這樣最終就能夠儲存不同類型的值了。範例 8-10 展示了其用例：

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

<span class="caption">範例 8-10：定義一個枚舉，以便能在 vector 中存放不同類型的數據</span>

Rust 在編譯時就必須準確的知道 vector 中類型的原因在於它需要知道儲存每個元素到底需要多少記憶體。第二個好處是可以準確的知道這個 vector 中允許什麼類型。如果 Rust 允許 vector 存放任意類型，那麼當對 vector 元素執行操作時一個或多個類型的值就有可能會造成錯誤。使用枚舉外加 `match` 意味著 Rust 能在編譯時就保證總是會處理所有可能的情況，正如第六章講到的那樣。

如果在編寫程式時不能確切無遺地知道運行時會儲存進 vector 的所有類型，枚舉技術就行不通了。相反，你可以使用 trait 對象，第十七章會講到它。

現在我們了解了一些使用 vector 的最常見的方式，請一定去看看標準庫中 `Vec` 定義的很多其他實用方法的 API 文件。例如，除了 `push` 之外還有一個 `pop` 方法，它會移除並返回 vector 的最後一個元素。讓我們繼續下一個集合類型：`String`！

[deref]: ch15-02-deref.html#following-the-pointer-to-the-value-with-the-dereference-operator

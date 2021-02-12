## 定義模組來控制作用域與私有性

> [ch07-02-defining-modules-to-control-scope-and-privacy.md](https://github.com/rust-lang/book/blob/master/src/ch07-02-defining-modules-to-control-scope-and-privacy.md)
> <br>
> commit 34b089627cca09a73ce92a052222304bff0056e3

在本節，我們將討論模組和其它一些關於模組系統的部分，如允許你命名項的 *路徑*（*paths*）；用來將路徑引入作用域的 `use` 關鍵字；以及使項變為公有的 `pub` 關鍵字。我們還將討論 `as` 關鍵字、外部包和 glob 運算符。現在，讓我們把注意力放在模組上！

*模組* 讓我們可以將一個 crate 中的代碼進行分組，以提高可讀性與重用性。模組還可以控制項的 *私有性*，即項是可以被外部代碼使用的（*public*），還是作為一個內部實現的內容，不能被外部代碼使用（*private*）。

在餐飲業，餐館中會有一些地方被稱之為 *前台*（*front of house*），還有另外一些地方被稱之為 *後台*（*back of house*）。前台是招待顧客的地方，在這裡，店主可以為顧客安排座位，服務員接受顧客下單和付款，調酒師會製作飲品。後台則是由廚師工作的廚房，洗碗工的工作地點，以及經理做行政工作的地方組成。

我們可以將函數放置到嵌套的模組中，來使我們的 crate 結構與實際的餐廳結構相同。通過執行 `cargo new --lib restaurant`，來創建一個新的名為 `restaurant` 的庫。然後將範例 7-1 中所羅列出來的代碼放入 *src/lib.rs* 中，來定義一些模組和函數。

Filename: src/lib.rs

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}

        fn server_order() {}

        fn take_payment() {}
    }
}
```

<span class="caption">範例 7-1：一個包含了其他內建了函數的模組的 `front_of_house` 模組</span>

我們定義一個模組，是以 `mod` 關鍵字為起始，然後指定模組的名字（本例中叫做 `front_of_house`），並且用花括號包圍模組的主體。在模組內，我們還可以定義其他的模組，就像本例中的 `hosting` 和 `serving` 模組。模組還可以保存一些定義的其他項，比如結構體、枚舉、常量、特性、或者函數。

透過使用模組，我們可以將相關的定義分組到一起，並指出他們為什麼相關。程式設計師可以透過使用這段代碼，更加容易地找到他們想要的定義，因為他們可以基於分組來對代碼進行導航，而不需要閱讀所有的定義。程式設計師向這段代碼中添加一個新的功能時，他們也會知道代碼應該放置在何處，可以保持程序的組織性。

在前面我們提到了，`src/main.rs` 和 `src/lib.rs` 叫做 crate 根。之所以這樣叫它們是因為這兩個文件的內容都分別在 crate 模組結構的根組成了一個名為 `crate` 的模組，該結構被稱為 *模組樹*（*module tree*）。

範例 7-2 展示了範例 7-1 中的模組樹的結構。

```text
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

<span class="caption">範例 7-2: 範例 7-1 中代碼的模組樹</span>

這個樹展示了一些模組是如何被嵌入到另一個模組的（例如，`hosting` 嵌套在 `front_of_house` 中）。這個樹還展示了一些模組是互為 *兄弟*（*siblings*） 的，這意味著它們定義在同一模組中（`hosting` 和 `serving` 被一起定義在 `front_of_house` 中）。繼續沿用家庭關係的比喻，如果一個模組 A 被包含在模組 B 中，我們將模組 A 稱為模組 B 的 *子*（*child*），模組 B 則是模組 A 的 *父*（*parent*）。注意，整個模組樹都植根於名為 `crate` 的隱式模組下。

這個模組樹可能會令你想起電腦上文件系統的目錄樹；這是一個非常恰當的比喻！就像文件系統的目錄，你可以使用模組來組織你的代碼。並且，就像目錄中的文件，我們需要一種方法來找到模組。

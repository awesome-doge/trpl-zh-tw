## 將模組分割進不同文件

> [ch07-05-separating-modules-into-different-files.md](https://github.com/rust-lang/book/blob/master/src/ch07-05-separating-modules-into-different-files.md)
> <br>
> commit a5a5bf9d6ea5763a9110f727911a21da854b1d90

到目前為止，本章所有的例子都在一個文件中定義多個模組。當模組變得更大時，你可能想要將它們的定義移動到單獨的文件中，從而使代碼更容易閱讀。

例如，我們從範例 7-17 開始，將 `front_of_house` 模組移動到屬於它自己的文件 *src/front_of_house.rs* 中，通過改變 crate 根文件，使其包含範例 7-21 所示的代碼。在這個例子中，crate 根文件是 *src/lib.rs*，這也同樣適用於以 *src/main.rs* 為 crate 根文件的二進位制 crate 項。

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

<span class="caption">範例 7-21: 聲明 `front_of_house` 模組，其內容將位於 *src/front_of_house.rs*</span>

*src/front_of_house.rs* 會獲取 `front_of_house` 模組的定義內容，如範例 7-22 所示。

<span class="filename">檔案名: src/front_of_house.rs</span>

```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

<span class="caption">範例 7-22: 在 *src/front_of_house.rs* 中定義 `front_of_house`
模組</span>

在 `mod front_of_house` 後使用分號，而不是代碼塊，這將告訴 Rust 在另一個與模組同名的文件中載入模組的內容。繼續重構我們例子，將 `hosting` 模組也提取到其自己的文件中，僅對 *src/front_of_house.rs* 包含 `hosting` 模組的聲明進行修改：

<span class="filename">檔案名: src/front_of_house.rs</span>

```rust
pub mod hosting;
```

接著我們創建一個 *src/front_of_house* 目錄和一個包含 `hosting` 模組定義的 *src/front_of_house/hosting.rs* 文件：

<span class="filename">檔案名: src/front_of_house/hosting.rs</span>

```
pub fn add_to_waitlist() {}
```

模組樹依然保持相同，`eat_at_restaurant` 中的函數調用也無需修改繼續保持有效，即便其定義存在於不同的文件中。這個技巧讓你可以在模組代碼增長時，將它們移動到新文件中。

注意，*src/lib.rs* 中的 `pub use crate::front_of_house::hosting` 語句是沒有改變的，在文件作為 crate 的一部分而編譯時，`use` 不會有任何影響。`mod` 關鍵字聲明了模組，Rust 會在與模組同名的文件中查找模組的代碼。

## 總結

Rust 提供了將包分成多個 crate，將 crate 分成模組，以及透過指定絕對或相對路徑從一個模組引用另一個模組中定義的項的方式。你可以透過使用 `use` 語句將路徑引入作用域，這樣在多次使用時可以使用更短的路徑。模組定義的代碼預設是私有的，不過可以選擇增加 `pub` 關鍵字使其定義變為公有。

接下來，讓我們看看一些標準庫提供的集合數據類型，你可以利用它們編寫出漂亮整潔的代碼。

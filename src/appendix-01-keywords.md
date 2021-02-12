## 附錄 A：關鍵字

> [appendix-01-keywords.md](https://raw.githubusercontent.com/rust-lang/book/master/src/appendix-01-keywords.md)
> <br>
> commit 27dd97a785794709aa87c51ab697cded41e8163a

下面的列表包含 Rust 中正在使用或者以後會用到的關鍵字。因此，這些關鍵字不能被用作標識符（除了 “[原始標識符][raw-identifiers]” 部分介紹的原始標識符），這包括函數、變數、參數、結構體欄位、模組、crate、常量、宏、靜態值、屬性、類型、trait 或生命週期
的名字。

[raw-identifiers]: #raw-identifiers

### 目前正在使用的關鍵字

如下關鍵字目前有對應其描述的功能。

* `as` - 強制類型轉換，消除特定包含項的 trait 的歧義，或者對 `use` 和 `extern crate` 語句中的項重命名
* `break` - 立刻退出循環
* `const` - 定義常量或不變裸指針（constant raw pointer）
* `continue` - 繼續進入下一次循環疊代
* `crate` - 連結（link）一個外部 **crate** 或一個代表宏定義的 **crate** 的宏變數
* `dyn` - 動態分發 trait 對象
* `else` - 作為 `if` 和 `if let` 控制流結構的 fallback
* `enum` - 定義一個枚舉
* `extern` - 連結一個外部 **crate** 、函數或變數
* `false` - 布爾字面值 `false`
* `fn` - 定義一個函數或 **函數指針類型** (*function pointer type*)
* `for` - 遍歷一個疊代器或實現一個 trait 或者指定一個更高級的生命週期
* `if` - 基於條件表達式的結果分支
* `impl` - 實現自有或 trait 功能
* `in` - `for` 循環語法的一部分
* `let` - 綁定一個變數
* `loop` - 無條件循環
* `match` - 模式匹配
* `mod` - 定義一個模組
* `move` - 使閉包獲取其所捕獲項的所有權
* `mut` - 表示引用、裸指針或模式綁定的可變性
* `pub` - 表示結構體欄位、`impl` 塊或模組的公有可見性
* `ref` - 透過引用綁定
* `return` - 從函數中返回
* `Self` - 實現 trait 的類型的類型別名
* `self` - 表示方法本身或當前模組
* `static` - 表示全局變數或在整個程序執行期間保持其生命週期
* `struct` - 定義一個結構體
* `super` - 表示當前模組的父模組
* `trait` - 定義一個 trait
* `true` - 布爾字面值 `true`
* `type` - 定義一個類型別名或關聯類型
* `unsafe` - 表示不安全的代碼、函數、trait 或實現
* `use` - 引入外部空間的符號
* `where` - 表示一個約束類型的從句
* `while` - 基於一個表達式的結果判斷是否進行循環

### 保留做將來使用的關鍵字

如下關鍵字沒有任何功能，不過由 Rust 保留以備將來的應用。

* `abstract`
* `async`
* `await`
* `become`
* `box`
* `do`
* `final`
* `macro`
* `override`
* `priv`
* `try`
* `typeof`
* `unsized`
* `virtual`
* `yield`

### 原始標識符

原始標識符（Raw identifiers）允許你使用通常不能使用的關鍵字，其帶有 `r#` 前綴。

例如，`match` 是關鍵字。如果嘗試編譯如下使用 `match` 作為名字的函數：

```rust,ignore,does_not_compile
fn match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}
```

會得到這個錯誤：

```text
error: expected identifier, found keyword `match`
 --> src/main.rs:4:4
  |
4 | fn match(needle: &str, haystack: &str) -> bool {
  |    ^^^^^ expected identifier, found keyword
```

該錯誤表示你不能將關鍵字 `match` 用作函數標識符。你可以使用原始標識符將 `match` 作為函數名稱使用：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn r#match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}

fn main() {
    assert!(r#match("foo", "foobar"));
}
```

此代碼編譯沒有任何錯誤。注意 `r#` 前綴需同時用於函數名定義和 `main` 函數中的調用。

原始標識符允許使用你選擇的任何單詞作為標識符，即使該單詞恰好是保留關鍵字。 此外，原始標識符允許你使用以不同於你的 crate 使用的 Rust 版本編寫的庫。比如，`try` 在 2015 edition 中不是關鍵字，而在 2018 edition 則是。所以如果如果用 2015 edition 編寫的庫中帶有 `try` 函數，在 2018 edition 中調用時就需要使用原始標識符語法，在這裡是 `r#try`。有關版本的更多訊息，請參見[附錄 E][appendix-e].

[appendix-e]: appendix-05-editions.html

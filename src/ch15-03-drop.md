## 使用 `Drop` Trait 運行清理代碼

> [ch15-03-drop.md](https://github.com/rust-lang/book/blob/master/src/ch15-03-drop.md) <br>
> commit 57adb83f69a69e20862d9e107b2a8bab95169b4c

對於智慧指針模式來說第二個重要的 trait 是 `Drop`，其允許我們在值要離開作用域時執行一些程式碼。可以為任何類型提供 `Drop` trait 的實現，同時所指定的代碼被用於釋放類似於文件或網路連接的資源。我們在智慧指針上下文中討論 `Drop` 是因為其功能幾乎總是用於實現智慧指針。例如，`Box<T>` 自訂了 `Drop` 用來釋放 box 所指向的堆空間。

在其他一些語言中，我們不得不記住在每次使用完智慧指針實例後調用清理記憶體或資源的代碼。如果忘記的話，運行程式碼的系統可能會因為負荷過重而崩潰。在 Rust 中，可以指定每當值離開作用域時被執行的代碼，編譯器會自動插入這些程式碼。於是我們就不需要在程序中到處編寫在實例結束時清理這些變數的代碼 —— 而且還不會洩漏資源。

指定在值離開作用域時應該執行的代碼的方式是實現 `Drop` trait。`Drop` trait 要求實現一個叫做 `drop` 的方法，它獲取一個 `self` 的可變引用。為了能夠看出 Rust 何時調用 `drop`，讓我們暫時使用 `println!` 語句實現 `drop`。

範例 15-14 展示了唯一定製功能就是當其實例離開作用域時，列印出 `Dropping CustomSmartPointer!` 的結構體 `CustomSmartPointer`。這會示範 Rust 何時運行 `drop` 函數：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer { data: String::from("my stuff") };
    let d = CustomSmartPointer { data: String::from("other stuff") };
    println!("CustomSmartPointers created.");
}
```

<span class="caption">範例 15-14：結構體 `CustomSmartPointer`，其實現了放置清理代碼的 `Drop` trait</span>

`Drop` trait 包含在 prelude 中，所以無需導入它。我們在 `CustomSmartPointer` 上實現了 `Drop` trait，並提供了一個調用 `println!` 的 `drop` 方法實現。`drop` 函數體是放置任何當類型實例離開作用域時期望運行的邏輯的地方。這裡選擇列印一些文本以展示 Rust 何時調用 `drop`。

在 `main` 中，我們新建了兩個 `CustomSmartPointer` 實例並列印出了 `CustomSmartPointer created.`。在 `main` 的結尾，`CustomSmartPointer` 的實例會離開作用域，而 Rust 會調用放置於 `drop` 方法中的代碼，列印出最後的訊息。注意無需顯示調用 `drop` 方法：

當運行這個程序，會出現如下輸出：

```text
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

當實例離開作用域 Rust 會自動調用 `drop`，並調用我們指定的代碼。變數以被創建時相反的順序被丟棄，所以 `d` 在 `c` 之前被丟棄。這個例子剛好給了我們一個 drop 方法如何工作的可視化指導，不過通常需要指定類型所需執行的清理代碼而不是列印訊息。

#### 通過 `std::mem::drop` 提早丟棄值

不幸的是，我們並不能直截了當的禁用 `drop` 這個功能。通常也不需要禁用 `drop` ；整個 `Drop` trait 存在的意義在於其是自動處理的。然而，有時你可能需要提早清理某個值。一個例子是當使用智慧指針管理鎖時；你可能希望強制運行 `drop` 方法來釋放鎖以便作用域中的其他代碼可以獲取鎖。Rust 並不允許我們主動調用 `Drop` trait 的 `drop` 方法；當我們希望在作用域結束之前就強制釋放變數的話，我們應該使用的是由標準庫提供的 `std::mem::drop`。

如果我們像是範例 15-14 那樣嘗試調用 `Drop` trait 的 `drop` 方法，就會得到像範例 15-15 那樣的編譯錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let c = CustomSmartPointer { data: String::from("some data") };
    println!("CustomSmartPointer created.");
    c.drop();
    println!("CustomSmartPointer dropped before the end of main.");
}
```

<span class="caption">範例 15-15：嘗試手動調用 `Drop` trait 的 `drop` 方法提早清理</span>

如果嘗試編譯代碼會得到如下錯誤：

```text
error[E0040]: explicit use of destructor method
  --> src/main.rs:14:7
   |
14 |     c.drop();
   |       ^^^^ explicit destructor calls not allowed
```

錯誤訊息表明不允許顯式調用 `drop`。錯誤訊息使用了術語 **析構函數**（_destructor_），這是一個清理實例的函數的通用編程概念。**析構函數** 對應創建實例的 **構造函數**。Rust 中的 `drop` 函數就是這麼一個析構函數。

Rust 不允許我們顯式調用 `drop` 因為 Rust 仍然會在 `main` 的結尾對值自動調用 `drop`，這會導致一個 **double free** 錯誤，因為 Rust 會嘗試清理相同的值兩次。

因為不能禁用當值離開作用域時自動插入的 `drop`，並且不能顯式調用 `drop`，如果我們需要強制提早清理值，可以使用 `std::mem::drop` 函數。

`std::mem::drop` 函數不同於 `Drop` trait 中的 `drop` 方法。可以通過傳遞希望提早強制丟棄的值作為參數。`std::mem::drop` 位於 prelude，所以我們可以修改範例 15-15 中的 `main` 來調用 `drop` 函數。如範例 15-16 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# struct CustomSmartPointer {
#     data: String,
# }
#
# impl Drop for CustomSmartPointer {
#     fn drop(&mut self) {
#         println!("Dropping CustomSmartPointer with data `{}`!", self.data);
#     }
# }
#
fn main() {
    let c = CustomSmartPointer { data: String::from("some data") };
    println!("CustomSmartPointer created.");
    drop(c);
    println!("CustomSmartPointer dropped before the end of main.");
}
```

<span class="caption">範例 15-16: 在值離開作用域之前調用 `std::mem::drop` 顯式清理</span>

運行這段代碼會列印出如下：

```text
CustomSmartPointer created.
Dropping CustomSmartPointer with data `some data`!
CustomSmartPointer dropped before the end of main.
```

`` Dropping CustomSmartPointer with data `some data`! `` 出現在 `CustomSmartPointer created.` 和 `CustomSmartPointer dropped before the end of main.` 之間，表明了 `drop` 方法被調用了並在此丟棄了 `c`。

`Drop` trait 實現中指定的代碼可以用於許多方面，來使得清理變得方便和安全：比如可以用其創建我們自己的記憶體分配器！通過 `Drop` trait 和 Rust 所有權系統，你無需擔心之後的代碼清理，Rust 會自動考慮這些問題。

我們也無需擔心意外的清理掉仍在使用的值，這會造成編譯器錯誤：所有權系統確保引用總是有效的，也會確保 `drop` 只會在值不再被使用時被調用一次。

現在我們學習了 `Box<T>` 和一些智慧指針的特性，讓我們聊聊標準庫中定義的其他幾種智慧指針。

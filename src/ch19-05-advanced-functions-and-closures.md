## 高級函數與閉包

> [ch19-05-advanced-functions-and-closures.md](https://github.com/rust-lang/book/blob/master/src/ch19-05-advanced-functions-and-closures.md)
> <br>
> commit 426f3e4ec17e539ae9905ba559411169d303a031

接下來我們將探索一些有關函數和閉包的進階功能：函數指針以及返回值閉包。

### 函數指針

我們討論過了如何向函數傳遞閉包；也可以向函數傳遞常規函數！這在我們希望傳遞已經定義的函數而不是重新定義閉包作為參數時很有用。透過函數指針允許我們使用函數作為另一個函數的參數。函數的類型是 `fn` （使用小寫的 “f” ）以免與 `Fn` 閉包 trait 相混淆。`fn` 被稱為 **函數指針**（*function pointer*）。指定參數為函數指針的語法類似於閉包，如範例 19-27 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);

    println!("The answer is: {}", answer);
}
```

<span class="caption">範例 19-27: 使用 `fn` 類型接受函數指針作為參數</span>

這會列印出 `The answer is: 12`。`do_twice` 中的 `f` 被指定為一個接受一個 `i32` 參數並返回 `i32` 的 `fn`。接著就可以在 `do_twice` 函數體中調用 `f`。在  `main` 中，可以將函數名 `add_one` 作為第一個參數傳遞給 `do_twice`。

不同於閉包，`fn` 是一個類型而不是一個 trait，所以直接指定 `fn` 作為參數而不是聲明一個帶有 `Fn` 作為 trait bound 的泛型參數。

函數指針實現了所有三個閉包 trait（`Fn`、`FnMut` 和 `FnOnce`），所以總是可以在調用期望閉包的函數時傳遞函數指針作為參數。傾向於編寫使用泛型和閉包 trait 的函數，這樣它就能接受函數或閉包作為參數。

一個只期望接受 `fn` 而不接受閉包的情況的例子是與不存在閉包的外部代碼交互時：C 語言的函數可以接受函數作為參數，但 C 語言沒有閉包。

作為一個既可以使用內聯定義的閉包又可以使用命名函數的例子，讓我們看看一個 `map` 的應用。使用 `map` 函數將一個數字 vector 轉換為一個字串 vector，就可以使用閉包，比如這樣：

```rust
let list_of_numbers = vec![1, 2, 3];
let list_of_strings: Vec<String> = list_of_numbers
    .iter()
    .map(|i| i.to_string())
    .collect();
```

或者可以將函數作為 `map` 的參數來代替閉包，像是這樣：

```rust
let list_of_numbers = vec![1, 2, 3];
let list_of_strings: Vec<String> = list_of_numbers
    .iter()
    .map(ToString::to_string)
    .collect();
```

注意這裡必須使用 [“高級 trait”][advanced-traits]  部分講到的完全限定語法，因為存在多個叫做 `to_string` 的函數；這裡使用了定義於 `ToString` trait 的 `to_string` 函數，標準庫為所有實現了 `Display` 的類型實現了這個 trait。

另一個實用的模式暴露了元組結構體和元組結構體枚舉成員的實現細節。這些項使用 `()` 作為初始化語法，這看起來就像函數調用，同時它們確實被實現為返回由參數構造的實例的函數。它們也被稱為實現了閉包 trait 的函數指針，並可以採用類似如下的方式調用：

```rust
enum Status {
    Value(u32),
    Stop,
}

let list_of_statuses: Vec<Status> =
    (0u32..20)
    .map(Status::Value)
    .collect();
```

這裡創建了 `Status::Value` 實例，它通過 `map` 用範圍的每一個 `u32` 值調用 `Status::Value` 的初始化函數。一些人傾向於函數風格，一些人喜歡閉包。這兩種形式最終都會產生同樣的代碼，所以請使用對你來說更明白的形式吧。

### 返回閉包

閉包表現為 trait，這意味著不能直接返回閉包。對於大部分需要返回 trait 的情況，可以使用實現了期望返回的 trait 的具體類型來替代函數的返回值。但是這不能用於閉包，因為他們沒有一個可返回的具體類型；例如不允許使用函數指針 `fn` 作為返回值類型。

這段代碼嘗試直接返回閉包，它並不能編譯：

```rust,ignore,does_not_compile
fn returns_closure() -> Fn(i32) -> i32 {
    |x| x + 1
}
```

編譯器給出的錯誤是：

```text
error[E0277]: the trait bound `std::ops::Fn(i32) -> i32 + 'static:
std::marker::Sized` is not satisfied
 -->
  |
1 | fn returns_closure() -> Fn(i32) -> i32 {
  |                         ^^^^^^^^^^^^^^ `std::ops::Fn(i32) -> i32 + 'static`
  does not have a constant size known at compile-time
  |
  = help: the trait `std::marker::Sized` is not implemented for
  `std::ops::Fn(i32) -> i32 + 'static`
  = note: the return type of a function must have a statically known size
```

錯誤又一次指向了 `Sized` trait！Rust 並不知道需要多少空間來儲存閉包。不過我們在上一部分見過這種情況的解決辦法：可以使用 trait 對象：

```rust
fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}
```

這段代碼正好可以編譯。關於 trait 對象的更多內容，請回顧第十七章的 [“為使用不同類型的值而設計的 trait 對象”][using-trait-objects-that-allow-for-values-of-different-types] 部分。

接下來讓我們學習宏！

[advanced-traits]:
ch19-03-advanced-traits.html#advanced-traits
[using-trait-objects-that-allow-for-values-of-different-types]:
ch17-02-trait-objects.html#using-trait-objects-that-allow-for-values-of-different-types

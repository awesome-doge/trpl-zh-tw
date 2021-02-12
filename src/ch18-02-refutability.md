## Refutability（可反駁性）: 模式是否會匹配失效

> [ch18-02-refutability.md](https://github.com/rust-lang/book/blob/master/src/ch18-02-refutability.md)
> <br>
> commit 30fe5484f3923617410032d28e86a5afdf4076fb

模式有兩種形式：refutable（可反駁的）和 irrefutable（不可反駁的）。能匹配任何傳遞的可能值的模式被稱為是 **不可反駁的**（*irrefutable*）。一個例子就是 `let x = 5;` 語句中的 `x`，因為 `x` 可以匹配任何值所以不可能會失敗。對某些可能的值進行匹配會失敗的模式被稱為是 **可反駁的**（*refutable*）。一個這樣的例子便是 `if let Some(x) = a_value` 表達式中的 `Some(x)`；如果變數 `a_value` 中的值是 `None` 而不是 `Some`，那麼 `Some(x)` 模式不能匹配。

函數參數、 `let` 語句和 `for` 循環只能接受不可反駁的模式，因為通過不匹配的值程序無法進行有意義的工作。`if let` 和 `while let` 表達式被限制為只能接受可反駁的模式，因為根據定義他們意在處理可能的失敗：條件表達式的功能就是根據成功或失敗執行不同的操作。

通常我們無需擔心可反駁和不可反駁模式的區別，不過確實需要熟悉可反駁性的概念，這樣當在錯誤訊息中看到時就知道如何應對。遇到這些情況，根據代碼行為的意圖，需要修改模式或者使用模式的結構。

讓我們看看一個嘗試在 Rust 要求不可反駁模式的地方使用可反駁模式以及相反情況的例子。在範例 18-8 中，有一個 `let` 語句，不過模式被指定為可反駁模式 `Some(x)`。如你所見，這不能編譯：

```rust,ignore,does_not_compile
let Some(x) = some_option_value;
```

<span class="caption">範例 18-8: 嘗試在 `let` 中使用可反駁模式</span>

如果 `some_option_value` 的值是 `None`，其不會成功匹配模式 `Some(x)`，表明這個模式是可反駁的。然而 `let` 語句只能接受不可反駁模式因為代碼不能通過 `None` 值進行有效的操作。Rust 會在編譯時抱怨我們嘗試在要求不可反駁模式的地方使用可反駁模式：

```text
error[E0005]: refutable pattern in local binding: `None` not covered
 -->
  |
3 | let Some(x) = some_option_value;
  |     ^^^^^^^ pattern `None` not covered
```

因為我們沒有覆蓋（也不可能覆蓋！）到模式 `Some(x)` 的每一個可能的值, 所以 Rust 會合理地抗議。

為了修復在需要不可反駁模式的地方使用可反駁模式的情況，可以修改使用模式的代碼：不同於使用 `let`，可以使用 `if let`。如此，如果模式不匹配，大括號中的代碼將被忽略，其餘代碼保持有效。範例 18-9 展示了如何修復範例 18-8 中的代碼。

```rust
# let some_option_value: Option<i32> = None;
if let Some(x) = some_option_value {
    println!("{}", x);
}
```

<span class="caption">範例 18-9: 使用 `if let` 和一個帶有可反駁模式的代碼塊來代替 `let`</span>

我們給了代碼一個得以繼續的出路！這段代碼可以完美運行，儘管這意味著我們不能再使用不可反駁模式並免於收到錯誤。如果為 `if let` 提供了一個總是會匹配的模式，比如範例 18-10 中的 `x`，編譯器會給出一個警告：

```rust,ignore
if let x = 5 {
    println!("{}", x);
};
```

<span class="caption">範例 18-10: 嘗試把不可反駁模式用到 `if let` 上</span>

Rust 會抱怨將不可反駁模式用於 `if let` 是沒有意義的：

```text
warning: irrefutable if-let pattern
 --> <anon>:2:5
  |
2 | /     if let x = 5 {
3 | |     println!("{}", x);
4 | | };
  | |_^
  |
  = note: #[warn(irrefutable_let_patterns)] on by default
```

基於此，`match`匹配分支必須使用可反駁模式，除了最後一個分支需要使用能匹配任何剩餘值的不可反駁模式。Rust允許我們在只有一個匹配分支的`match`中使用不可反駁模式，不過這麼做不是特別有用，並可以被更簡單的 `let` 語句替代。

目前我們已經討論了所有可以使用模式的地方, 以及可反駁模式與不可反駁模式的區別，下面讓我們一起去把可以用來創建模式的語法過目一遍吧。

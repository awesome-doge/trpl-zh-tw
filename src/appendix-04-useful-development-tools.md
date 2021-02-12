## 附錄 D：實用開發工具

> [appendix-04-useful-development-tools.md](https://github.com/rust-lang/book/blob/master/src/appendix-04-useful-development-tools.md)
> <br />
> commit 70a82519e48b8a61f98cabb8ff443d1b21962fea

本附錄，我們將討論 Rust 項目提供的用於開發 Rust 代碼的工具。

### 通過 `rustfmt` 自動格式化

`rustfmt` 工具根據社區代碼風格格式化程式碼。很多項目使用 `rustfmt` 來避免編寫 Rust 風格的爭論：所有人都用這個工具格式化程式碼！

安裝 `rustfmt`：

```text
$ rustup component add rustfmt
```

這會提供 `rustfmt` 和 `cargo-fmt`，類似於 Rust 同時安裝 `rustc` 和 `cargo`。為了格式化整個 Cargo 項目：

```text
$ cargo fmt
```

運行此命令會格式化當前 crate 中所有的 Rust 代碼。這應該只會改變代碼風格，而不是代碼語義。請查看 [該文件][rustfmt] 了解 `rustfmt` 的更多訊息。

[rustfmt]: https://github.com/rust-lang-nursery/rustfmt

### 通過 `rustfix` 修復代碼

如果你編寫過 Rust 代碼，那麼你可能見過編譯器警告。例如，考慮如下代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn do_something() {}

fn main() {
    for i in 0..100 {
        do_something();
    }
}
```

這裡調用了 `do_something` 函數 100 次，不過從未在 `for` 循環體中使用變數 `i`。Rust 會警告說：

```text
$ cargo build
   Compiling myprogram v0.1.0 (file:///projects/myprogram)
warning: unused variable: `i`
 --> src/main.rs:4:9
  |
4 |     for i in 1..100 {
  |         ^ help: consider using `_i` instead
  |
  = note: #[warn(unused_variables)] on by default

    Finished dev [unoptimized + debuginfo] target(s) in 0.50s
```

警告中建議使用 `_i` 名稱：下劃線表明該變數有意不使用。我們可以通過 `cargo fix` 命令使用 `rustfix` 工具來自動採用該建議：

```text
$ cargo fix
    Checking myprogram v0.1.0 (file:///projects/myprogram)
      Fixing src/main.rs (1 fix)
    Finished dev [unoptimized + debuginfo] target(s) in 0.59s
```

如果再次查看 *src/main.rs*，會發現 `cargo fix` 修改了代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn do_something() {}

fn main() {
    for _i in 0..100 {
        do_something();
    }
}
```

現在 `for` 循環變數變為 `_i`，警告也不再出現。

`cargo fix` 命令可以用於在不同 Rust 版本間遷移代碼。版本在附錄 E 中介紹。

### 通過 `clippy` 提供更多 lint 功能

`clippy` 工具是一系列 lint 的集合，用於捕捉常見錯誤和改進 Rust 代碼。

安裝 `clippy`：

```text
$ rustup component add clippy
```

對任何 Cargo 項目運行 clippy 的 lint：

```text
$ cargo clippy
```

例如，如果程序使用了如 pi 這樣數學常數的近似值，如下：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 3.1415;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

在此項目上運行 `cargo clippy` 會導致這個錯誤：

```text
error: approximate value of `f{32, 64}::consts::PI` found. Consider using it directly
 --> src/main.rs:2:13
  |
2 |     let x = 3.1415;
  |             ^^^^^^
  |
  = note: #[deny(clippy::approx_constant)] on by default
  = help: for further information visit https://rust-lang-nursery.github.io/rust-clippy/master/index.html#approx_constant
```

這告訴我們 Rust 定義了更為精確的常量，而如果使用了這些常量程序將更加準確。如下代碼就不會導致 `clippy` 產生任何錯誤或警告：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = std::f64::consts::PI;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

請查看 [其文件][clippy] 來了解 `clippy` 的更多訊息。

[clippy]: https://github.com/rust-lang/rust-clippy

### 使用 Rust Language Server 的 IDE 集成

為了幫助 IDE 集成，Rust 項目分發了 `rls`，其為 Rust Language Server 的縮寫。這個工具採用 [Language Server Protocol][lsp]，這是一個 IDE 與程式語言溝通的規格說明。`rls` 可以用於不同的用戶端，比如 [Visual Studio: Code 的 Rust 插件][vscode]。

[lsp]: http://langserver.org/
[vscode]: https://marketplace.visualstudio.com/items?itemName=rust-lang.rust

`rls` 工具的質量還未達到發布 1.0 版本的水準，不過目前有一個可用的預覽版。請嘗試使用並告訴我們它如何！

安裝 `rls`：

```text
$ rustup component add rls
```

接著為特定的 IDE 安裝 language server 支持，如此便會獲得如自動補全、跳轉到定義和 inline error 之類的功能。

請查看 [其文件][rls] 來了解 `rls` 的更多訊息。

[rls]: https://github.com/rust-lang/rls

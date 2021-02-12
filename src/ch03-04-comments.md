## 注釋

> [ch03-04-comments.md](https://github.com/rust-lang/book/blob/master/src/ch03-04-comments.md)
> <br>
> commit 75a77762ea2d2ab7fa1e9ef733907ed727c85651

所有程式設計師都力求使其代碼易於理解，不過有時還需要提供額外的解釋。在這種情況下，程式設計師在原始碼中留下記錄，或者 **注釋**（*comments*），編譯器會忽略它們，不過閱讀代碼的人可能覺得有用。

這是一個簡單的注釋：

```rust
// hello, world
```

在 Rust 中，注釋必須以兩道斜槓開始，並持續到本行的結尾。對於超過一行的注釋，需要在每一行前都加上 `//`，像這樣：

```rust
// So we’re doing something complicated here, long enough that we need
// multiple lines of comments to do it! Whew! Hopefully, this comment will
// explain what’s going on.
```

注釋也可以在放在包含代碼的行的末尾：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let lucky_number = 7; // I’m feeling lucky today
}
```

不過你更經常看到的是以這種格式使用它們，也就是位於它所解釋的代碼行的上面一行：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    // I’m feeling lucky today
    let lucky_number = 7;
}
```

Rust 還有另一種注釋，稱為文件注釋，我們將在 14 章的 “將 crate 發布到 Crates.io” 部分討論它。

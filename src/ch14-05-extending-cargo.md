## Cargo 自訂擴展命令

> [ch14-05-extending-cargo.md](https://github.com/rust-lang/book/blob/master/src/ch14-05-extending-cargo.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

Cargo 的設計使得開發者可以透過新的子命令來對 Cargo 進行擴展，而無需修改 Cargo 本身。如果 `$PATH` 中有類似 `cargo-something` 的二進位制文件，就可以通過 `cargo something` 來像 Cargo 子命令一樣運行它。像這樣的自訂命令也可以運行 `cargo --list` 來展示出來。能夠通過 `cargo install` 向 Cargo 安裝擴展並可以如內建 Cargo 工具那樣運行他們是 Cargo 設計上的一個非常方便的優點！

## 總結

通過 Cargo 和 [crates.io](https://crates.io/)<!-- ignore --> 來分享代碼是使得 Rust 生態環境可以用於許多不同的任務的重要組成部分。Rust 的標準庫是小而穩定的，不過 crate 易於分享和使用，並採用一個不同語言自身的時間線來提供改進。不要羞於在 [crates.io](https://crates.io/)<!-- ignore --> 上共享對你有用的代碼；因為它很有可能對別人也很有用！

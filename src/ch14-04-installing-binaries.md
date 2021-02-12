## 使用 `cargo install` 從 Crates.io 安裝二進位制文件

> [ch14-04-installing-binaries.md](https://github.com/rust-lang/book/blob/master/src/ch14-04-installing-binaries.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

`cargo install` 命令用於在本地安裝和使用二進位制 crate。它並不打算替換系統中的包；它意在作為一個方便 Rust 開發者們安裝其他人已經在 [crates.io](https://crates.io/)<!-- ignore --> 上共享的工具的手段。只有擁有二進位制目標文件的包能夠被安裝。**二進位制目標** 文件是在 crate 有 *src/main.rs* 或者其他指定為二進位制文件時所創建的可執行程序，這不同於自身不能執行但適合包含在其他程序中的庫目標文件。通常 crate 的 *README* 文件中有該 crate 是庫、二進位制目標還是兩者都是的訊息。

所有來自 `cargo install` 的二進位制文件都安裝到 Rust 安裝根目錄的 *bin* 文件夾中。如果你使用 *rustup.rs* 安裝的 Rust 且沒有自訂任何配置，這將是 `$HOME/.cargo/bin`。確保將這個目錄添加到 `$PATH` 環境變數中就能夠運行通過 `cargo install` 安裝的程序了。

例如，第十二章提到的叫做 `ripgrep` 的用於搜尋文件的 `grep` 的 Rust 實現。如果想要安裝 `ripgrep`，可以運行如下：

```text
$ cargo install ripgrep
Updating registry `https://github.com/rust-lang/crates.io-index`
 Downloading ripgrep v0.3.2
 --snip--
   Compiling ripgrep v0.3.2
    Finished release [optimized + debuginfo] target(s) in 97.91 secs
  Installing ~/.cargo/bin/rg
```

最後一行輸出展示了安裝的二進位制文件的位置和名稱，在這裡 `ripgrep` 被命名為 `rg`。只要你像上面提到的那樣將安裝目錄加入 `$PATH`，就可以運行 `rg --help` 並開始使用一個更快更 Rust 的工具來搜尋文件了！

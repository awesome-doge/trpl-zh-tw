## Hello, Cargo!

> [ch01-03-hello-cargo.md](https://github.com/rust-lang/book/blob/master/src/ch01-03-hello-cargo.md)
> <br>
> commit f63a103270ec8416899675a9cdb1c5cf6d77a498

Cargo 是 Rust 的構建系統和包管理器。大多數 Rustacean 們使用 Cargo 來管理他們的 Rust 項目，因為它可以為你處理很多任務，比如構建代碼、下載依賴庫並編譯這些庫。（我們把代碼所需要的庫叫做 **依賴**（*dependencies*））。

最簡單的 Rust 程序，比如我們剛剛編寫的，沒有任何依賴。所以如果使用 Cargo 來構建 “Hello, world!” 項目，將只會用到 Cargo 構建代碼的那部分功能。在編寫更複雜的 Rust 程序時，你將添加依賴項，如果使用 Cargo 啟動項目，則添加依賴項將更容易。

由於絕大多數 Rust 項目使用 Cargo，本書接下來的部分假設你也使用 Cargo。如果使用 [“安裝”][installation] 部分介紹的官方安裝包的話，則自帶了 Cargo。如果透過其他方式安裝的話，可以在終端輸入如下命令檢查是否安裝了 Cargo：

```text
$ cargo --version
```

如果你看到了版本號，說明已安裝！如果看到類似 `command not found` 的錯誤，你應該查看相應安裝文件以確定如何單獨安裝 Cargo。

### 使用 Cargo 創建項目

我們使用 Cargo 創建一個新項目，然後看看與上面的 Hello, world! 項目有什麼不同。回到 *projects* 目錄（或者你存放代碼的目錄）。接著，可在任何操作系統下運行以下命令：

```text
$ cargo new hello_cargo
$ cd hello_cargo
```

第一行命令新建了名為 *hello_cargo* 的目錄。我們將項目命名為 *hello_cargo*，同時 Cargo 在一個同名目錄中創建項目文件。

進入 *hello_cargo* 目錄並列出文件。將會看到 Cargo 生成了兩個文件和一個目錄：一個 *Cargo.toml* 文件，一個 *src* 目錄，以及位於 *src* 目錄中的 *main.rs* 文件。它也在 *hello_cargo* 目錄初始化了一個 git 倉庫，以及一個 *.gitignore* 文件。

> 注意：Git 是一個常用的版本控制系統（version control system， VCS）。可以通過 `--vcs` 參數使 `cargo new` 切換到其它版本控制系統（VCS），或者不使用 VCS。運行 `cargo new --help` 參看可用的選項。

請自行選用文本編輯器打開 *Cargo.toml* 文件。它應該看起來如範例 1-2 所示：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
authors = ["Your Name <you@example.com>"]
edition = "2018"

[dependencies]
```

<span class="caption">範例 1-2: *cargo new* 命令生成的 *Cargo.toml* 的內容</span>

這個文件使用 [*TOML*][toml]<!-- ignore --> (*Tom's Obvious, Minimal Language*) 格式，這是 Cargo 配置文件的格式。

[toml]: https://github.com/toml-lang/toml

第一行，`[package]`，是一個片段（section）標題，表明下面的語句用來配置一個包。隨著我們在這個文件增加更多的訊息，還將增加其他片段（section）。

接下來的四行設置了 Cargo 編譯程序所需的配置：項目的名稱、版本、作者以及要使用的 Rust 版本。Cargo 從環境中獲取你的名字和 email 訊息，所以如果這些訊息不正確，請修改並保存此文件。附錄 E 會介紹 `edition` 的值。

最後一行，`[dependencies]`，是羅列項目依賴的片段的開始。在 Rust 中，代碼包被稱為 *crates*。這個項目並不需要其他的 crate，不過在第二章的第一個項目會用到依賴，那時會用得上這個片段。

現在打開 *src/main.rs* 看看：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo 為你生成了一個 “Hello, world!” 程序，正如我們之前編寫的範例 1-1！目前為止，之前項目與 Cargo 生成項目的區別是 Cargo 將代碼放在 *src* 目錄，同時項目根目錄包含一個 *Cargo.toml* 配置文件。

Cargo 期望源文件存放在 *src* 目錄中。項目根目錄只存放 README、license 訊息、配置文件和其他跟代碼無關的文件。使用 Cargo 幫助你保持項目乾淨整潔，一切井井有條。

如果沒有使用 Cargo 開始項目，比如我們創建的 Hello,world! 項目，可以將其轉化為一個 Cargo 項目。將代碼放入 *src* 目錄，並創建一個合適的 *Cargo.toml* 文件。

### 構建並運行 Cargo 項目

現在讓我們看看通過 Cargo 構建和運行 “Hello, world!” 程序有什麼不同！在 *hello_cargo* 目錄下，輸入下面的命令來構建項目：

```text
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

這個命令會創建一個可執行文件 *target/debug/hello_cargo* （在 Windows 上是 *target\debug\hello_cargo.exe*），而不是放在目前目錄下。可以通過這個命令運行可執行文件：

```text
$ ./target/debug/hello_cargo # 或者在 Windows 下為 .\target\debug\hello_cargo.exe
Hello, world!
```

如果一切順利，終端上應該會列印出 `Hello, world!`。首次運行 `cargo build` 時，也會使 Cargo 在項目根目錄創建一個新文件：*Cargo.lock*。這個文件記錄項目依賴的實際版本。這個項目並沒有依賴，所以其內容比較少。你自己永遠也不需要碰這個文件，讓 Cargo 處理它就行了。

我們剛剛使用 `cargo build` 構建了項目，並使用 `./target/debug/hello_cargo` 運行了程序，也可以使用 `cargo run` 在一個命令中同時編譯並運行生成的可執行文件：

```text
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

注意這一次並沒有出現表明 Cargo 正在編譯 `hello_cargo` 的輸出。Cargo 發現文件並沒有被改變，就直接運行了二進位制文件。如果修改了源文件的話，Cargo 會在運行之前重新構建項目，並會出現像這樣的輸出：

```text
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

Cargo 還提供了一個叫 `cargo check` 的命令。該命令快速檢查代碼確保其可以編譯，但並不產生可執行文件：

```text
$ cargo check
   Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

為什麼你會不需要可執行文件呢？通常 `cargo check` 要比 `cargo build` 快得多，因為它省略了生成可執行文件的步驟。如果你在編寫程式碼時持續的進行檢查，`cargo check` 會加速開發！為此很多 Rustaceans 編寫程式碼時定期運行 `cargo check` 確保它們可以編譯。當準備好使用可執行文件時才運行 `cargo build`。

我們回顧下已學習的 Cargo 內容：

* 可以使用 `cargo build` 或 `cargo check` 構建項目。
* 可以使用 `cargo run` 一步構建並運行項目。
* 有別於將構建結果放在與原始碼相同的目錄，Cargo 會將其放到 *target/debug* 目錄。

使用 Cargo 的一個額外的優點是，不管你使用什麼操作系統，其命令都是一樣的。所以從現在開始本書將不再為 Linux 和 macOS 以及 Windows 提供相應的命令。

### 發布（release）構建

當項目最終準備好發布時，可以使用 `cargo build --release` 來最佳化編譯項目。這會在 *target/release* 而不是 *target/debug* 下生成可執行文件。這些最佳化可以讓 Rust 代碼運行的更快，不過啟用這些最佳化也需要消耗更長的編譯時間。這也就是為什麼會有兩種不同的配置：一種是為了開發，你需要經常快速重新構建；另一種是為用戶構建最終程序，它們不會經常重新構建，並且希望程序運行得越快越好。如果你在測試代碼的運行時間，請確保運行 `cargo build --release` 並使用 *target/release* 下的可執行文件進行測試。

### 把 Cargo 當作習慣

對於簡單項目， Cargo 並不比 `rustc` 提供了更多的優勢，不過隨著開發的深入，終將證明其價值。對於擁有多個 crate 的複雜項目，交給 Cargo 來協調構建將簡單的多。

即便 `hello_cargo` 項目十分簡單，它現在也使用了很多在你之後的 Rust 生涯將會用到的實用工具。其實，要在任何已存在的項目上工作時，可以使用如下命令通過 Git 檢出代碼，移動到該項目目錄並構建：

```text
$ git clone someurl.com/someproject
$ cd someproject
$ cargo build
```

關於更多 Cargo 的訊息，請查閱 [其文件][its documentation]。

[its documentation]: https://doc.rust-lang.org/cargo/

## 總結

你已經準備好開啟 Rust 之旅了！在本章中，你學習了如何：

* 使用 `rustup` 安裝最新穩定版的 Rust
* 更新到新版的 Rust
* 打開本地安裝的文件
* 直接通過 `rustc` 編寫並運行 Hello, world! 程序
* 使用 Cargo 創建並運行新項目

是時候透過構建更實質性的程序來熟悉讀寫 Rust 代碼了。所以在第二章我們會構建一個猜猜看遊戲程序。如果你更願意從學習 Rust 常用的程式概念開始，請閱讀第三章，接著再回到第二章。

[installation]: ch01-01-installation.html#installation

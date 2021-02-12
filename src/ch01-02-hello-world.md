## Hello, World!

> [ch01-02-hello-world.md](https://github.com/rust-lang/book/blob/master/src/ch01-02-hello-world.md)
> <br>
> commit f63a103270ec8416899675a9cdb1c5cf6d77a498

既然安裝好了 Rust，我們來編寫第一個 Rust 程序。當學習一門新語言的時候，使用該語言在螢幕上列印 `Hello, world!` 是一項傳統，我們將沿用這一傳統！

> 注意：本書假設你熟悉基本的命令行操作。Rust 對於你的編輯器、工具，以及代碼位於何處並沒有特定的要求，如果你更傾向於使用集成開發環境（IDE），而不是命令行，請儘管使用你喜歡的 IDE。目前很多 IDE 已經不同程度的支持 Rust；查看 IDE 文件了解更多細節。最近，Rust 團隊已經致力於提供強大的 IDE 支持，而且進展飛速！

### 創建項目目錄

首先創建一個存放 Rust 代碼的目錄。Rust 並不關心代碼的存放位置，不過對於本書的練習和項目來說，我們建議你在 home 目錄中創建 *projects* 目錄，並將你的所有項目存放在這裡。

打開終端並輸入如下命令創建 *projects* 目錄，並在 *projects* 目錄中為 “Hello, world!” 項目創建一個目錄。

對於 Linux、macOS 和 Windows PowerShell，輸入：

```text
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

對於 Windows CMD，輸入：

```cmd
> mkdir "%USERPROFILE%\projects"
> cd /d "%USERPROFILE%\projects"
> mkdir hello_world
> cd hello_world
```

### 編寫並運行 Rust 程序

接下來，新建一個源文件，命名為 *main.rs*。Rust 源文件總是以 *.rs* 副檔名結尾。如果檔案名包含多個單詞，使用下劃線分隔它們。例如命名為 *hello_world.rs*，而不是 *helloworld.rs*。

現在打開剛創建的 *main.rs* 文件，輸入範例 1-1 中的代碼。

<span class="filename">檔案名: main.rs</span>

```rust
fn main() {
    println!("Hello, world!");
}
```

<span class="caption">範例 1-1: 一個列印 `Hello, world!` 的程序</span>

保存文件，並回到終端窗口。在 Linux 或 macOS 上，輸入如下命令，編譯並運行文件：

```text
$ rustc main.rs
$ ./main
Hello, world!
```

在 Windows 上，輸入命令 `.\main.exe`，而不是 `./main`：

```powershell
> rustc main.rs
> .\main.exe
Hello, world!
```

不管使用何種操作系統，終端應該列印字串 `Hello, world!`。如果沒有看到這些輸出，回到安裝部分的 [“故障排除”][troubleshooting] 小節查找有幫助的方法。

如果 `Hello, world!` 出現了，恭喜你！你已經正式編寫了一個 Rust 程序。現在你成為一名 Rust 程式設計師，歡迎！

### 分析這個 Rust 程序

現在，讓我們回過頭來仔細看看 “Hello, world!” 程序中到底發生了什麼事。這是第一塊拼圖：

```rust
fn main() {

}
```

這幾行定義了一個 Rust 函數。`main` 函數是一個特殊的函數：在可執行的 Rust 程序中，它總是最先運行的代碼。第一行程式碼聲明了一個叫做 `main` 的函數，它沒有參數也沒有返回值。如果有參數的話，它們的名稱應該出現在小括號中，`()`。

還須注意，函數體被包裹在花括號中，`{}`。Rust 要求所有函數體都要用花括號包裹起來。一般來說，將左花括號與函數聲明置於同一行並以空格分隔，是良好的代碼風格。

在編寫本書的時候，一個叫做 `rustfmt` 的自動格式化工具正在開發中。如果你希望在 Rust 項目中保持一種標準風格，`rustfmt` 會將代碼格式化為特定的風格。Rust 團隊計劃最終將該工具包含在標準 Rust 發行版中，就像 `rustc`。所以根據你閱讀本書的時間，它可能已經安裝到你的電腦中了！檢查線上文件以了解更多細節。

在 `main()` 函數中是如下代碼：

```rust
    println!("Hello, world!");
```

這行程式碼完成這個簡單程序的所有工作：在螢幕上列印文本。這裡有四個重要的細節需要注意。首先 Rust 的縮進風格使用 4 個空格，而不是 1 個製表符（tab）。

第二，`println!` 調用了一個 Rust 宏（macro）。如果是調用函數，則應輸入 `println`（沒有`!`）。我們將在第十九章詳細討論宏。現在你只需記住，當看到符號 `!` 的時候，就意味著調用的是宏而不是普通函數。

第三，`"Hello, world!"` 是一個字串。我們把這個字串作為一個參數傳遞給 `println!`，字串將被列印到螢幕上。

第四，該行以分號結尾（`;`），這代表一個表達式的結束和下一個表達式的開始。大部分 Rust 代碼行以分號結尾。

### 編譯和運行是彼此獨立的步驟

你剛剛運行了一個新創建的程序，那麼讓我們檢查此過程中的每一個步驟。

在運行 Rust 程序之前，必須先使用 Rust 編譯器編譯它，即輸入 `rustc` 命令並傳入源檔案名稱，如下：

```text
$ rustc main.rs
```

如果你有 C 或 C++ 背景，就會發現這與 `gcc` 和 `clang` 類似。編譯成功後，Rust 會輸出一個二進位制的可執行文件。

在 Linux、macOS 或 Windows 的 PowerShell 上，在 shell 中輸入 `ls` 命令可以看見這個可執行文件。在 Linux 和 macOS，你會看到兩個文件。在 Windows PowerShell 中，你會看到同使用 CMD 相同的三個文件。

```text
$ ls
main  main.rs
```

在 Windows 的 CMD 上，則輸入如下內容：

```cmd
> dir /B %= the /B option says to only show the file names =%
main.exe
main.pdb
main.rs
```

這展示了副檔名為 *.rs* 的源文件、可執行文件（在 Windows 下是 *main.exe*，其它平台是 *main*），以及當使用 CMD 時會有一個包含除錯訊息、副檔名為 *.pdb* 的文件。從這裡開始運行 *main* 或 *main.exe* 文件，如下：

```text
$ ./main # Windows 是 .\main.exe
```

如果 *main.rs* 是上文所述的 “Hello, world!” 程序，它將會在終端上列印 `Hello, world!`。

如果你更熟悉動態語言，如 Ruby、Python 或 JavaScript，則可能不習慣將編譯和運行分為兩個單獨的步驟。Rust 是一種 **預編譯靜態類型**（*ahead-of-time compiled*）語言，這意味著你可以編譯程序，並將可執行文件送給其他人，他們甚至不需要安裝 Rust 就可以運行。如果你給他人一個 *.rb*、*.py* 或 *.js* 文件，他們需要先分別安裝 Ruby，Python，JavaScript 實現（運行時環境，VM）。不過在這些語言中，只需要一句命令就可以編譯和運行程序。這一切都是語言設計上的權衡取捨。

僅僅使用 `rustc` 編譯簡單程序是沒問題的，不過隨著項目的增長，你可能需要管理你項目的各個方面，並讓代碼易於分享。接下來，我們要介紹一個叫做 Cargo 的工具，它會幫助你編寫真實世界中的 Rust 程序。

[troubleshooting]: ch01-01-installation.html#troubleshooting

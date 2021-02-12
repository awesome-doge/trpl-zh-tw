## 安裝

> [ch01-01-installation.md](https://github.com/rust-lang/book/blob/master/src/ch01-01-installation.md) <br>
> commit bad683bb7dcd06ef7f5f83bad3a25b1706b7b230

第一步是安裝 Rust。我們會通過 `rustup` 下載 Rust，這是一個管理 Rust 版本和相關工具的命令行工具。下載時需要聯網。

> 注意：如果你出於某些理由傾向於不使用 `rustup`，請到 [Rust 安裝頁面](https://www.rust-lang.org/install.html) 查看其它安裝選項。

接下來的步驟會安裝最新的穩定版 Rust 編譯器。Rust 的穩定性確保本書所有範例在最新版本的 Rust 中能夠繼續編譯。不同版本的輸出可能略有不同，因為 Rust 經常改進錯誤訊息和警告。也就是說，任何通過這些步驟安裝的最新穩定版 Rust，都應該能正常運行本書中的內容。

> ### 命令行標記
>
> 本章和全書中，我們會展示一些在終端中使用的命令。所有需要輸入到終端的行都以 `$` 開頭。但無需輸入`$`；它代表每行命令的起點。不以 `$` 起始的行通常展示之前命令的輸出。另外，PowerShell 專用的範例會採用 `>` 而不是 `$`。

### 在 Linux 或 macOS 上安裝 `rustup`

如果你使用 Linux 或 macOS，打開終端並輸入如下命令：

```text
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

此命令下載一個腳本並開始安裝 `rustup` 工具，這會安裝最新穩定版 Rust。過程中可能會提示你輸入密碼。如果安裝成功，將會出現如下內容：

```text
Rust is installed now. Great!
```

另外，你需要一個某種類型的連結器（linker）。很有可能已經安裝，不過當你嘗試編譯 Rust 程序時，卻有錯誤指出無法執行連結器，這意味著你的系統上沒有安裝連結器，你需要自行安裝一個。C 編譯器通常帶有正確的連結器。請查看你使用平台的文件，了解如何安裝 C 編譯器。並且，一些常用的 Rust 包依賴 C 代碼，也需要安裝 C 編譯器。因此現在安裝一個是值得的。

### 在 Windows 上安裝 `rustup`

在 Windows 上，前往 [https://www.rust-lang.org/install.html][install] 並按照說明安裝 Rust。在安裝過程的某個步驟，你會收到一個訊息說明為什麼需要安裝 Visual Studio 2013 或更新版本的 C++ build tools。獲取這些 build tools 最方便的方法是安裝 [Build Tools for Visual Studio 2019][visualstudio]。當被問及需要安裝什麼的時候請確保選擇 ”C++ build tools“，並確保包括了 Windows 10 SDK 和英文語言包（English language pack）組件。

[install]: https://www.rust-lang.org/tools/install
[visualstudio]: https://visualstudio.microsoft.com/visual-cpp-build-tools/

本書的餘下部分會使用能同時執行於 *cmd.exe* 和 PowerShell 的命令。如果存在特定差異，我們會解釋使用哪一個。

### 更新和卸載

通過 `rustup` 安裝了 Rust 之後，很容易更新到最新版本。在 shell 中運行如下更新腳本：

```text
$ rustup update
```

為了卸載 Rust 和 `rustup`，在 shell 中運行如下卸載腳本:

```text
$ rustup self uninstall
```

### 故障排除（Troubleshooting）

要檢查是否正確安裝了 Rust，打開 shell 並運行如下行：

```text
$ rustc --version
```

你應能看到已發布的最新穩定版的版本號、提交哈希和提交日期，顯示為如下格式：

```text
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果出現這些內容，Rust 就安裝成功了！如果並沒有看到這些訊息，並且使用的是 Windows，請檢查 Rust 是否位於 `%PATH%` 系統變數中。如果一切正確但 Rust 仍不能使用，有許多地方可以求助。最簡單的是 [位於 Rust 官方 Discord][discord] 上的 #beginners 頻道。在這裡你可以和其他 Rustacean（Rust 用戶的稱號，有自嘲意味）聊天並尋求幫助。其它厲害的資源包括[用戶論壇][users]和 [Stack Overflow][stackoverflow]。

[discord]: https://discord.gg/rust-lang
[users]: https://users.rust-lang.org/
[stackoverflow]: https://stackoverflow.com/questions/tagged/rust

> 譯者：恭喜入坑！（此處應該有掌聲！）

### 本地文件

安裝程式也自帶一份文件的本地拷貝，可以離線閱讀。運行 `rustup doc` 在瀏覽器中查看本地文件。

任何時候，如果你不確定標準庫中的類型或函數的用途和用法，請查閱應用程式介面（application programming interface，API）文件！

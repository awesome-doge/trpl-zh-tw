### 接受命令行參數

> [ch12-01-accepting-command-line-arguments.md](https://github.com/rust-lang/book/blob/master/src/ch12-01-accepting-command-line-arguments.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

一如既往使用 `cargo new` 新建一個項目，我們稱之為 `minigrep` 以便與可能已經安裝在系統上的 `grep` 工具相區別：

```text
$ cargo new minigrep
     Created binary (application) `minigrep` project
$ cd minigrep
```

第一個任務是讓 `minigrep` 能夠接受兩個命令行參數：檔案名和要搜索的字串。也就是說我們希望能夠使用 `cargo run`、要搜尋的字串和被搜索的文件的路徑來運行程序，像這樣：

```text
$ cargo run searchstring example-filename.txt
```

現在 `cargo new` 生成的程序忽略任何傳遞給它的參數。[Crates.io](https://crates.io/) 上有一些現成的庫可以幫助我們接受命令行參數，不過我們正在學習這些內容，讓我們自己來實現一個。

### 讀取參數值

為了確保 `minigrep` 能夠獲取傳遞給它的命令行參數的值，我們需要一個 Rust 標準庫提供的函數，也就是 `std::env::args`。這個函數返回一個傳遞給程序的命令行參數的 **疊代器**（*iterator*）。我們會在 [第十三章][ch13] 全面的介紹它們。但是現在只需理解疊代器的兩個細節：疊代器生成一系列的值，可以在疊代器上調用 `collect` 方法將其轉換為一個集合，比如包含所有疊代器產生元素的 vector。

使用範例 12-1 中的代碼來讀取任何傳遞給 `minigrep` 的命令行參數並將其收集到一個 vector 中。

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    println!("{:?}", args);
}
```

<span class="caption">範例 12-1：將命令行參數收集到一個 vector 中並列印出來</span>

首先使用 `use` 語句來將 `std::env` 模組引入作用域以便可以使用它的 `args` 函數。注意 `std::env::args` 函數被嵌套進了兩層模組中。正如 [第七章][ch7-idiomatic-use] 講到的，當所需函數嵌套了多於一層模組時，通常將父模組引入作用域，而不是其自身。這便於我們利用 `std::env` 中的其他函數。這比增加了 `use std::env::args;` 後僅僅使用 `args` 調用函數要更明確一些，因為 `args` 容易被錯認成一個定義於當前模組的函數。

> ### `args` 函數和無效的 Unicode
>
> 注意 `std::env::args` 在其任何參數包含無效 Unicode 字元時會 panic。如果你需要接受包含無效 Unicode 字元的參數，使用 `std::env::args_os` 代替。這個函數返回 `OsString` 值而不是 `String` 值。這裡出於簡單考慮使用了 `std::env::args`，因為 `OsString` 值每個平台都不一樣而且比 `String` 值處理起來更為複雜。

在 `main` 函數的第一行，我們調用了 `env::args`，並立即使用 `collect` 來創建了一個包含疊代器所有值的 vector。`collect` 可以被用來創建很多類型的集合，所以這裡顯式註明 `args` 的類型來指定我們需要一個字串 vector。雖然在 Rust 中我們很少會需要註明類型，然而 `collect` 是一個經常需要註明類型的函數，因為 Rust 不能推斷出你想要什麼類型的集合。

最後，我們使用除錯格式 `:?` 列印出 vector。讓我們嘗試分別用兩種方式（不包含參數和包含參數）運行程式碼：

```text
$ cargo run
--snip--
["target/debug/minigrep"]

$ cargo run needle haystack
--snip--
["target/debug/minigrep", "needle", "haystack"]
```

注意 vector 的第一個值是 `"target/debug/minigrep"`，它是我們二進位制文件的名稱。這與 C 中的參數列表的行為相匹配，讓程序使用在執行時調用它們的名稱。如果要在消息中列印它或者根據用於調用程序的命令行別名更改程序的行為，通常可以方便地訪問程序名稱，不過考慮到本章的目的，我們將忽略它並只保存所需的兩個參數。

### 將參數值保存進變數

列印出參數 vector 中的值展示了程序可以訪問指定為命令行參數的值。現在需要將這兩個參數的值保存進變數這樣就可以在程序的餘下部分使用這些值了。讓我們如範例 12-2 這樣做：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let filename = &args[2];

    println!("Searching for {}", query);
    println!("In file {}", filename);
}
```

<span class="caption">範例 12-2：創建變數來存放查詢參數和檔案名參數</span>

正如之前列印出 vector 時所所看到的，程序的名稱占據了 vector 的第一個值 `args[0]`，所以我們從索引 `1` 開始。`minigrep` 獲取的第一個參數是需要搜索的字串，所以將其將第一個參數的引用存放在變數 `query` 中。第二個參數將是檔案名，所以將第二個參數的引用放入變數 `filename` 中。

我們將臨時列印出這些變數的值來證明代碼如我們期望的那樣工作。使用參數 `test` 和 `sample.txt` 再次運行這個程序：

```text
$ cargo run test sample.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/minigrep test sample.txt`
Searching for test
In file sample.txt
```

好的，它可以工作！我們將所需的參數值保存進了對應的變數中。之後會增加一些錯誤處理來應對類似用戶沒有提供參數的情況，不過現在我們將忽略他們並開始增加讀取文件功能。

[ch13]: ch13-00-functional-features.html
[ch7-idiomatic-use]: ch07-04-bringing-paths-into-scope-with-the-use-keyword.html#creating-idiomatic-use-paths

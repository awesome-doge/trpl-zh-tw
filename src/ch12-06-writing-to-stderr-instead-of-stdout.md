## 將錯誤訊息輸出到標準錯誤而不是標準輸出

> [ch12-06-writing-to-stderr-instead-of-stdout.md](https://github.com/rust-lang/book/blob/master/src/ch12-06-writing-to-stderr-instead-of-stdout.md)
> <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

目前為止，我們將所有的輸出都 `println!` 到了終端。大部分終端都提供了兩種輸出：**標準輸出**（*standard output*，`stdout`）對應一般訊息，**標準錯誤**（*standard error*，`stderr`）則用於錯誤訊息。這種區別允許用戶選擇將程序正常輸出定向到一個文件中並仍將錯誤訊息列印到螢幕上。

但是 `println!` 函數只能夠列印到標準輸出，所以我們必需使用其他方法來列印到標準錯誤。

### 檢查錯誤應該寫入何處

首先，讓我們觀察一下目前 `minigrep` 列印的所有內容是如何被寫入標準輸出的，包括那些應該被寫入標準錯誤的錯誤訊息。可以透過將標準輸出流重定向到一個文件同時有意產生一個錯誤來做到這一點。我們沒有重定向標準錯誤流，所以任何發送到標準錯誤的內容將會繼續顯示在螢幕上。

命令行程序被期望將錯誤訊息發送到標準錯誤流，這樣即便選擇將標準輸出流重定向到文件中時仍然能看到錯誤訊息。目前我們的程序並不符合期望；相反我們將看到它將錯誤訊息輸出保存到了文件中。

我們通過 `>` 和檔案名 *output.txt* 來運行程序，我們期望重定向標準輸出流到該文件中。在這裡，我們沒有傳遞任何參數，所以會產生一個錯誤：

```text
$ cargo run > output.txt
```

`>` 語法告訴 shell 將標準輸出的內容寫入到 *output.txt* 文件中而不是螢幕上。我們並沒有看到期望的錯誤訊息列印到螢幕上，所以這意味著它一定被寫入了文件中。如下是 *output.txt* 所包含的：

```text
Problem parsing arguments: not enough arguments
```

是的，錯誤訊息被列印到了標準輸出中。像這樣的錯誤訊息被列印到標準錯誤中將會有用得多，將使得只有成功運行所產生的輸出才會寫入檔案。我們接下來就修改。

### 將錯誤列印到標準錯誤

讓我們如範例 12-24 所示的代碼改變錯誤訊息是如何被列印的。得益於本章早些時候的重構，所有列印錯誤訊息的代碼都位於 `main` 一個函數中。標準庫提供了 `eprintln!` 宏來列印到標準錯誤流，所以將兩個調用 `println!` 列印錯誤訊息的位置替換為 `eprintln!`：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {}", e);

        process::exit(1);
    }
}
```

<span class="caption">範例 12-24：使用 `eprintln!` 將錯誤訊息寫入標準錯誤而不是標準輸出</span>

將 `println!` 改為 `eprintln!` 之後，讓我們再次嘗試用同樣的方式運行程序，不使用任何參數並通過 `>` 重定向標準輸出：

```text
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

現在我們看到了螢幕上的錯誤訊息，同時 *output.txt* 裡什麼也沒有，這正是命令行程序所期望的行為。

如果使用不會造成錯誤的參數再次運行程序，不過仍然將標準輸出重定向到一個文件，像這樣：

```text
$ cargo run to poem.txt > output.txt
```

我們並不會在終端看到任何輸出，同時 `output.txt` 將會包含其結果：

<span class="filename">檔案名: output.txt</span>

```text
Are you nobody, too?
How dreary to be somebody!
```

這一部分展示了現在我們適當的使用了成功時產生的標準輸出和錯誤時產生的標準錯誤。

## 總結

在這一章中，我們回顧了目前為止的一些主要章節並涉及了如何在 Rust 環境中進行常規的 I/O 操作。透過使用命令行參數、文件、環境變數和列印錯誤的 `eprintln!` 宏，現在你已經準備好編寫命令行程序了。通過結合前幾章的知識，你的代碼將會是組織良好的，並能有效的將數據存儲到合適的數據結構中、更好的處理錯誤，並且還是經過良好測試的。

接下來，讓我們探索一些 Rust 中受函數式程式語言影響的功能：閉包和疊代器。

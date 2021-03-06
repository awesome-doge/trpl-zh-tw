### 讀取文件

> [ch12-02-reading-a-file.md](https://github.com/rust-lang/book/blob/master/src/ch12-02-reading-a-file.md)
> <br>
> commit 76df60bccead5f3de96db23d97b69597cd8a2b82

現在我們要增加讀取由 `filename` 命令行參數指定的文件的功能。首先，需要一個用來測試的範例文件：用來確保 `minigrep` 正常工作的最好的文件是擁有多行少量文本且有一些重複單詞的文件。範例 12-3 是一首艾米莉·狄金森（Emily Dickinson）的詩，它正適合這個工作！在項目根目錄創建一個文件 `poem.txt`，並輸入詩 "I'm nobody! Who are you?"：

<span class="filename">檔案名: poem.txt</span>

```text
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

<span class="caption">範例 12-3：艾米莉·狄金森的詩 “I’m nobody! Who are you?”，一個好的測試用例</span>

創建完這個文件之後，修改 *src/main.rs* 並增加如範例 12-4 所示的打開文件的代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic
use std::env;
use std::fs;

fn main() {
#     let args: Vec<String> = env::args().collect();
#
#     let query = &args[1];
#     let filename = &args[2];
#
#     println!("Searching for {}", query);
    // --snip--
    println!("In file {}", filename);

    let contents = fs::read_to_string(filename)
        .expect("Something went wrong reading the file");

    println!("With text:\n{}", contents);
}
```

<span class="caption">範例 12-4：讀取第二個參數所指定的文件內容</span>

首先，我們增加了一個 `use` 語句來引入標準庫中的相關部分：我們需要 `std::fs` 來處理文件。

在 `main` 中新增了一行語句：`fs::read_to_string` 接受 `filename`，打開文件，接著返回包含其內容的 `Result<String>`。

在這些程式碼之後，我們再次增加了臨時的 `println!` 列印出讀取文件之後 `contents` 的值，這樣就可以檢查目前為止的程序能否工作。

嘗試運行這些程式碼，隨意指定一個字串作為第一個命令行參數（因為還未實現搜索功能的部分）而將 *poem.txt* 文件將作為第二個參數：

```text
$ cargo run the poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/minigrep the poem.txt`
Searching for the
In file poem.txt
With text:
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us — don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

好的！代碼讀取並列印出了文件的內容。雖然它還有一些瑕疵：`main` 函數有著多個職能，通常函數隻負責一個功能的話會更簡潔並易於維護。另一個問題是沒有儘可能的處理錯誤。雖然我們的程序還很小，這些瑕疵並不是什麼大問題，不過隨著程式功能的豐富，將會越來越難以用簡單的方法修復他們。在開發程序時，及早開始重構是一個最佳實踐，因為重構少量代碼時要容易的多，所以讓我們現在就開始吧。

## 改進 I/O 項目

> [ch13-03-improving-our-io-project.md](https://github.com/rust-lang/book/blob/master/src/ch13-03-improving-our-io-project.md)
> <br>
> commit 6555fb6c805fbfe7d0961980991f8bca6918928f

有了這些關於疊代器的新知識，我們可以使用疊代器來改進第十二章中 I/O 項目的實現來使得代碼更簡潔明瞭。讓我們看看疊代器如何能夠改進 `Config::new` 函數和 `search` 函數的實現。

### 使用疊代器並去掉 `clone`

在範例 12-6 中，我們增加了一些程式碼獲取一個 `String` slice 並創建一個 `Config` 結構體的實例，他們索引 slice 中的值並複製這些值以便 `Config` 結構體可以擁有這些值。在範例 13-24 中重現了第十二章結尾範例 12-23 中 `Config::new` 函數的實現：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Config {
    pub fn new(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let filename = args[2].clone();

        let case_sensitive = env::var("CASE_INSENSITIVE").is_err();

        Ok(Config { query, filename, case_sensitive })
    }
}
```

<span class="caption">範例 13-24：重現第十二章結尾的 `Config::new` 函數</span>

那時我們說過不必擔心低效的 `clone` 調用了，因為將來可以對他們進行改進。好吧，就是現在！

起初這裡需要 `clone` 的原因是參數 `args` 中有一個 `String` 元素的 slice，而 `new` 函數並不擁有 `args`。為了能夠返回 `Config` 實例的所有權，我們需要複製 `Config` 中欄位 `query` 和 `filename` 的值，這樣 `Config` 實例就能擁有這些值。

在學習了疊代器之後，我們可以將 `new` 函數改為獲取一個有所有權的疊代器作為參數而不是借用 slice。我們將使用疊代器功能之前檢查 slice 長度和索引特定位置的代碼。這會明確 `Config::new` 的工作因為疊代器會負責訪問這些值。

一旦 `Config::new` 獲取了疊代器的所有權並不再使用借用的索引操作，就可以將疊代器中的 `String` 值移動到 `Config` 中，而不是調用 `clone` 分配新的空間。

#### 直接使用 `env::args` 返回的疊代器

打開 I/O 項目的 *src/main.rs* 文件，它看起來應該像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    // --snip--
}
```

修改第十二章結尾範例 12-24 中的 `main` 函數的開頭為範例 13-25 中的代碼。在更新 `Config::new` 之前這些程式碼還不能編譯：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
fn main() {
    let config = Config::new(env::args()).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    // --snip--
}
```

<span class="caption">範例 13-25：將 `env::args` 的返回值傳遞給 `Config::new`</span>

`env::args` 函數返回一個疊代器！不同於將疊代器的值收集到一個 vector 中接著傳遞一個 slice 給 `Config::new`，現在我們直接將 `env::args` 返回的疊代器的所有權傳遞給 `Config::new`。

接下來需要更新 `Config::new` 的定義。在 I/O 項目的 *src/lib.rs* 中，將 `Config::new` 的簽名改為如範例 13-26 所示。這仍然不能編譯因為我們還需更新函數體：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Config {
    pub fn new(mut args: std::env::Args) -> Result<Config, &'static str> {
        // --snip--
```

<span class="caption">範例 13-26：以疊代器作為參數更新 `Config::new` 的簽名

`env::args` 函數的標準庫文件顯示，它返回的疊代器的類型為 `std::env::Args`。我們已經更新了 `Config :: new` 函數的簽名，因此參數 `args` 的類型為 `std::env::Args` 而不是 `&[String]`。因為我們擁有 `args` 的所有權，並且將透過對其進行疊代來改變 `args` ，所以我們可以將 `mut` 關鍵字添加到 `args` 參數的規範中以使其可變。

#### 使用 `Iterator` trait 代替索引

接下來，我們將修改 `Config::new` 的內容。標準庫文件還提到 `std::env::Args` 實現了 `Iterator` trait，因此我們知道可以對其調用 `next` 方法！範例 13-27 更新了範例 12-23 中的代碼，以使用 `next` 方法：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
# use std::env;
#
# struct Config {
#     query: String,
#     filename: String,
#     case_sensitive: bool,
# }
#
impl Config {
    pub fn new(mut args: std::env::Args) -> Result<Config, &'static str> {
        args.next();

        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };

        let filename = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file name"),
        };

        let case_sensitive = env::var("CASE_INSENSITIVE").is_err();

        Ok(Config { query, filename, case_sensitive })
    }
}
```

<span class="caption">範例 13-27：修改 `Config::new` 的函數體來使用疊代器方法</span>

請記住 `env::args` 返回值的第一個值是程序的名稱。我們希望忽略它並獲取下一個值，所以首先調用 `next` 並不對返回值做任何操作。之後對希望放入 `Config` 中欄位 `query` 調用 `next`。如果 `next` 返回 `Some`，使用 `match` 來提取其值。如果它返回 `None`，則意味著沒有提供足夠的參數並通過 `Err` 值提早返回。對 `filename` 值進行同樣的操作。

### 使用疊代器適配器來使代碼更簡明

I/O 項目中其他可以利用疊代器的地方是 `search` 函數，範例 13-28 中重現了第十二章結尾範例 12-19 中此函數的定義：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}
```

<span class="caption">範例 13-28：範例 12-19 中 `search` 函數的定義</span>

可以透過使用疊代器適配器方法來編寫更簡明的代碼。這也避免了一個可變的中間 `results` vector 的使用。函數式編程風格傾向於最小化可變狀態的數量來使代碼更簡潔。去掉可變狀態可能會使得將來進行並行搜索的增強變得更容易，因為我們不必管理 `results` vector 的並發訪問。範例 13-29 展示了該變化：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents.lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

<span class="caption">範例 13-29：在 `search` 函數實現中使用疊代器適配器</span>

回憶 `search` 函數的目的是返回所有 `contents` 中包含 `query` 的行。類似於範例 13-19 中的 `filter` 例子，可以使用 `filter` 適配器只保留 `line.contains(query)` 返回 `true` 的那些行。接著使用 `collect` 將匹配行收集到另一個 vector 中。這樣就容易多了！嘗試對 `search_case_insensitive` 函數做出同樣的使用疊代器方法的修改吧。

接下來的邏輯問題就是在代碼中應該選擇哪種風格：是使用範例 13-28 中的原始實現還是使用範例 13-29 中使用疊代器的版本？大部分 Rust 程式設計師傾向於使用疊代器風格。開始這有點難以理解，不過一旦你對不同疊代器的工作方式有了感覺之後，疊代器可能會更容易理解。相比擺弄不同的循環並創建新 vector，（疊代器）代碼則更關注循環的目的。這抽象掉那些老生常談的代碼，這樣就更容易看清代碼所特有的概念，比如疊代器中每個元素必須面對的過濾條件。

不過這兩種實現真的完全等同嗎？直覺上的假設是更底層的循環會更快一些。讓我們聊聊性能吧。

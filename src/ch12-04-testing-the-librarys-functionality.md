## 採用測試驅動開發完善庫的功能

> [ch12-04-testing-the-librarys-functionality.md](https://github.com/rust-lang/book/blob/master/src/ch12-04-testing-the-librarys-functionality.md)
> <br>
> commit 0ca4b88f75f8579de87adc2ad36d340709f5ccad

現在我們將邏輯提取到了 *src/lib.rs* 並將所有的參數解析和錯誤處理留在了 *src/main.rs* 中，為代碼的核心功能編寫測試將更加容易。我們可以直接使用多種參數調用函數並檢查返回值而無需從命令行運行二進位制文件了。如果你願意的話，請自行為 `Config::new` 和 `run` 函數的功能編寫一些測試。

在這一部分，我們將遵循測試驅動開發（Test Driven Development, TDD）的模式來逐步增加 `minigrep` 的搜索邏輯。這是一個軟體開發技術，它遵循如下步驟：

1. 編寫一個失敗的測試，並運行它以確保它失敗的原因是你所期望的。
2. 編寫或修改足夠的代碼來使新的測試通過。
3. 重構剛剛增加或修改的代碼，並確保測試仍然能通過。
4. 從步驟 1 開始重複！

這只是眾多編寫軟體的方法之一，不過 TDD 有助於驅動代碼的設計。在編寫能使測試通過的代碼之前編寫測試有助於在開發過程中保持高測試覆蓋率。

我們將測試驅動實現實際在文件內容中搜尋查詢字串並返回匹配的行範例的功能。我們將在一個叫做 `search` 的函數中增加這些功能。

### 編寫失敗測試

去掉 *src/lib.rs* 和 *src/main.rs* 中用於檢查程序行為的 `println!` 語句，因為不再真正需要他們了。接著我們會像 [第十一章][ch11-anatomy] 那樣增加一個 `test` 模組和一個測試函數。測試函數指定了 `search` 函數期望擁有的行為：它會獲取一個需要查詢的字串和用來查詢的文本，並只會返回包含請求的文本行。範例 12-15 展示了這個測試，它還不能編譯：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
#      vec![]
# }
#
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(
            vec!["safe, fast, productive."],
            search(query, contents)
        );
    }
}
```

<span class="caption">範例 12-15：創建一個我們期望的 `search` 函數的失敗測試</span>

這裡選擇使用 `"duct"` 作為這個測試中需要搜索的字串。用來搜尋的文本有三行，其中只有一行包含 `"duct"`。我們斷言 `search` 函數的返回值只包含期望的那一行。

我們還不能運行這個測試並看到它失敗，因為它甚至都還不能編譯：`search` 函數還不存在呢！我們將增加足夠的代碼來使其能夠編譯：一個總是會返回空 vector 的 `search` 函數定義，如範例 12-16 所示。然後這個測試應該能夠編譯並因為空 vector 並不匹配一個包含一行 `"safe, fast, productive."` 的 vector 而失敗。

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    vec![]
}
```

<span class="caption">範例 12-16：剛好足夠使測試通過編譯的 `search` 函數定義</span>

注意需要在 `search` 的簽名中定義一個顯式生命週期 `'a` 並用於 `contents` 參數和返回值。回憶一下 [第十章][ch10-lifetimes] 中講到生命週期參數指定哪個參數的生命週期與返回值的生命週期相關聯。在這個例子中，我們表明返回的 vector 中應該包含引用參數 `contents`（而不是參數`query`） slice 的字串 slice。

換句話說，我們告訴 Rust 函數 `search` 返回的數據將與 `search` 函數中的參數 `contents` 的數據存在的一樣久。這是非常重要的！為了使這個引用有效那麼 **被** slice 引用的數據也需要保持有效；如果編譯器認為我們是在創建 `query` 而不是 `contents` 的字串 slice，那麼安全檢查將是不正確的。

如果嘗試不用生命週期編譯的話，我們將得到如下錯誤：

```text
error[E0106]: missing lifetime specifier
 --> src/lib.rs:5:51
  |
5 | pub fn search(query: &str, contents: &str) -> Vec<&str> {
  |                                                   ^ expected lifetime
parameter
  |
  = help: this function's return type contains a borrowed value, but the
  signature does not say whether it is borrowed from `query` or `contents`
```

Rust 不可能知道我們需要的是哪一個參數，所以需要告訴它。因為參數 `contents` 包含了所有的文本而且我們希望返回匹配的那部分文本，所以我們知道 `contents` 是應該要使用生命週期語法來與返回值相關聯的參數。

其他語言中並不需要你在函數簽名中將參數與返回值相關聯。所以這麼做可能仍然感覺有些陌生，隨著時間的推移這將會變得越來越容易。你可能想要將這個例子與第十章中 [“生命週期與引用有效性”][validating-references-with-lifetimes] 部分做對比。

現在運行測試：

```text
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
--warnings--
    Finished dev [unoptimized + debuginfo] target(s) in 0.43 secs
     Running target/debug/deps/minigrep-abcabcabc

running 1 test
test tests::one_result ... FAILED

failures:

---- tests::one_result stdout ----
        thread 'tests::one_result' panicked at 'assertion failed: `(left ==
right)`
left: `["safe, fast, productive."]`,
right: `[]`)', src/lib.rs:48:8
note: Run with `RUST_BACKTRACE=1` for a backtrace.


failures:
    tests::one_result

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

error: test failed, to rerun pass '--lib'
```

好的，測試失敗了，這正是我們所期望的。修改代碼來讓測試通過吧！

### 編寫使測試通過的代碼

目前測試之所以會失敗是因為我們總是返回一個空的 vector。為了修復並實現 `search`，我們的程序需要遵循如下步驟：

* 遍歷內容的每一行文本。
* 查看這一行是否包含要搜索的字串。
* 如果有，將這一行加入列表返回值中。
* 如果沒有，什麼也不做。
* 返回匹配到的結果列表

讓我們一步一步的來，從遍歷每行開始。

#### 使用 `lines` 方法遍歷每一行

Rust 有一個有助於一行一行遍歷字串的方法，出於方便它被命名為 `lines`，它如範例 12-17 這樣工作。注意這還不能編譯：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        // do something with line
    }
}
```

<span class="caption">範例 12-17：遍歷 `contents` 的每一行</span>

`lines` 方法返回一個疊代器。[第十三章][ch13-iterators] 會深入了解疊代器，不過我們已經在 [範例 3-5][ch3-iter] 中見過使用疊代器的方法了，在那裡使用了一個 `for` 循環和疊代器在一個集合的每一項上運行了一些程式碼。

#### 用查詢字串搜索每一行

接下來將會增加檢查當前行是否包含查詢字串的功能。幸運的是，字串類型為此也有一個叫做 `contains` 的實用方法！如範例 12-18 所示在 `search` 函數中加入 `contains` 方法調用。注意這仍然不能編譯：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        if line.contains(query) {
            // do something with line
        }
    }
}
```

<span class="caption">範例 12-18：增加檢查文本行是否包含 `query` 中字串的功能</span>

#### 存儲匹配的行

我們還需要一個方法來存儲包含查詢字串的行。為此可以在 `for` 循環之前創建一個可變的 vector 並調用 `push` 方法在 vector 中存放一個 `line`。在 `for` 循環之後，返回這個 vector，如範例 12-19 所示：

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

<span class="caption">範例 12-19：儲存匹配的行以便可以返回他們</span>

現在 `search` 函數應該返回只包含 `query` 的那些行，而測試應該會通過。讓我們運行測試：

```text
$ cargo test
--snip--
running 1 test
test tests::one_result ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

測試通過了，它可以工作了！

現在正是可以考慮重構的時機，在保證測試通過，保持功能不變的前提下重構 `search` 函數。`search` 函數中的代碼並不壞，不過並沒有利用疊代器的一些實用功能。第十三章將回到這個例子並深入探索疊代器並看看如何改進代碼。

#### 在 `run` 函數中使用 `search` 函數

現在 `search` 函數是可以工作並測試通過了的，我們需要實際在 `run` 函數中調用 `search`。需要將 `config.query` 值和 `run` 從文件中讀取的 `contents` 傳遞給 `search` 函數。接著 `run` 會列印出 `search` 返回的每一行：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.filename)?;

    for line in search(&config.query, &contents) {
        println!("{}", line);
    }

    Ok(())
}
```

這裡仍然使用了 `for` 循環獲取了 `search` 返回的每一行並列印出來。

現在整個程序應該可以工作了！讓我們試一試，首先使用一個只會在艾米莉·狄金森的詩中返回一行的單詞 “frog”：

```text
$ cargo run frog poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished dev [unoptimized + debuginfo] target(s) in 0.38 secs
     Running `target/debug/minigrep frog poem.txt`
How public, like a frog
```

好的！現在試試一個會匹配多行的單詞，比如 “body”：

```text
$ cargo run body poem.txt
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/minigrep body poem.txt`
I’m nobody! Who are you?
Are you nobody, too?
How dreary to be somebody!
```

最後，讓我們確保搜索一個在詩中哪裡都沒有的單詞時不會得到任何行，比如 "monomorphization"：

```text
$ cargo run monomorphization poem.txt
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/minigrep monomorphization poem.txt`
```

非常好！我們創建了一個屬於自己的迷你版經典工具，並學習了很多如何組織程序的知識。我們還學習了一些文件輸入輸出、生命週期、測試和命令行解析的內容。

為了使這個項目更豐滿，我們將簡要的展示如何處理環境變數和列印到標準錯誤，這兩者在編寫命令行程序時都很有用。

[validating-references-with-lifetimes]:
ch10-03-lifetime-syntax.html#validating-references-with-lifetimes
[ch11-anatomy]: ch11-01-writing-tests.html#the-anatomy-of-a-test-function
[ch10-lifetimes]: ch10-03-lifetime-syntax.html
[ch3-iter]: ch03-05-control-flow.html#looping-through-a-collection-with-for
[ch13-iterators]: ch13-02-iterators.html

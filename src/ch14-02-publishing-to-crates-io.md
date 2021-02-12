## 將 crate 發布到 Crates.io

> [ch14-02-publishing-to-crates-io.md](https://github.com/rust-lang/book/blob/master/src/ch14-02-publishing-to-crates-io.md) <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

我們曾經在項目中使用 [crates.io](https://crates.io)<!-- ignore --> 上的包作為依賴，不過你也可以透過發布自己的包來向它人分享代碼。[crates.io](https://crates.io)<!-- ignore --> 用來分發包的原始碼，所以它主要託管開原始碼。

Rust 和 Cargo 有一些幫助它人更方便找到和使用你發布的包的功能。我們將介紹一些這樣的功能，接著講到如何發布一個包。

### 編寫有用的文件注釋

準確的包文件有助於其他用戶理解如何以及何時使用他們，所以花一些時間編寫文件是值得的。第三章中我們討論了如何使用兩斜槓 `//` 注釋 Rust 代碼。Rust 也有特定的用於文件的注釋類型，通常被稱為 **文件注釋**（_documentation comments_），他們會生成 HTML 文件。這些 HTML 展示公有 API 文件注釋的內容，他們意在讓對庫感興趣的程式設計師理解如何 **使用** 這個 crate，而不是它是如何被 **實現** 的。

文件注釋使用三斜槓 `///` 而不是兩斜杆以支持 Markdown 註解來格式化文本。文件注釋就位於需要文件的項的之前。範例 14-1 展示了一個 `my_crate` crate 中 `add_one` 函數的文件注釋：

<span class="filename">檔案名: src/lib.rs</span>

````rust,ignore
/// Adds one to the number given.
///
/// # Examples
///
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
///
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
````

<span class="caption">範例 14-1：一個函數的文件注釋</span>

這裡，我們提供了一個 `add_one` 函數工作的描述，接著開始了一個標題為 `Examples` 的部分，和展示如何使用 `add_one` 函數的代碼。可以運行 `cargo doc` 來生成這個文件注釋的 HTML 文件。這個命令運行由 Rust 分發的工具 `rustdoc` 並將生成的 HTML 文件放入 _target/doc_ 目錄。

為了方便起見，運行 `cargo doc --open` 會構建當前 crate 文件（同時還有所有 crate 依賴的文件）的 HTML 並在瀏覽器中打開。導航到 `add_one` 函數將會發現文件注釋的文本是如何渲染的，如圖 14-1 所示：

<img alt="`my_crate` 的 `add_one` 函數所渲染的文件注釋 HTML" src="img/trpl14-01.png" class="center" />

<span class="caption">圖 14-1：`add_one` 函數的文件注釋 HTML</span>

#### 常用（文件注釋）部分

範例 14-1 中使用了 `# Examples` Markdown 標題在 HTML 中創建了一個以 “Examples” 為標題的部分。其他一些 crate 作者經常在文件注釋中使用的部分有：

- **Panics**：這個函數可能會 `panic!` 的場景。並不希望程序崩潰的函數調用者應該確保他們不會在這些情況下調用此函數。
- **Errors**：如果這個函數返回 `Result`，此部分描述可能會出現何種錯誤以及什麼情況會造成這些錯誤，這有助於調用者編寫程式碼來採用不同的方式處理不同的錯誤。
- **Safety**：如果這個函數使用 `unsafe` 代碼（這會在第十九章討論），這一部分應該會涉及到期望函數調用者支持的確保 `unsafe` 塊中代碼正常工作的不變條件（invariants）。

大部分文件注釋不需要所有這些部分，不過這是一個提醒你檢查調用你代碼的人有興趣了解的內容的列表。

#### 文件注釋作為測試

在文件注釋中增加範例代碼塊是一個清楚的表明如何使用庫的方法，這麼做還有一個額外的好處：`cargo test` 也會像測試那樣運行文件中的範例代碼！沒有什麼比有例子的文件更好的了，但最糟糕的莫過於寫完文件後改動了代碼，而導致例子不能正常工作。嘗試 `cargo test` 運行像範例 14-1 中 `add_one` 函數的文件；應該在測試結果中看到像這樣的部分：

```text
   Doc-tests my_crate

running 1 test
test src/lib.rs - add_one (line 5) ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

現在嘗試改變函數或例子來使例子中的 `assert_eq!` 產生 panic。再次運行 `cargo test`，你將會看到文件測試捕獲到了例子與代碼不再同步！

#### 注釋包含項的結構

還有另一種風格的文件注釋，`//!`，這為包含注釋的項，而不是位於注釋之後的項增加文件。這通常用於 crate 根文件（通常是 _src/lib.rs_）或模組的根文件為 crate 或模組整體提供文件。

作為一個例子，如果我們希望增加描述包含 `add_one` 函數的 `my_crate` crate 目的的文件，可以在 _src/lib.rs_ 開頭增加以 `//!` 開頭的注釋，如範例 14-2 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
//! # My Crate
//!
//! `my_crate` is a collection of utilities to make performing certain
//! calculations more convenient.

/// Adds one to the number given.
// --snip--
```

<span class="caption">範例 14-2：`my_crate` crate 整體的文件</span>

注意 `//!` 的最後一行之後沒有任何代碼。因為他們以 `//!` 開頭而不是 `///`，這是屬於包含此注釋的項而不是注釋之後項的文件。在這個情況中，包含這個注釋的項是 _src/lib.rs_ 文件，也就是 crate 根文件。這些注釋描述了整個 crate。

如果運行 `cargo doc --open`，將會發現這些注釋顯示在 `my_crate` 文件的首頁，位於 crate 中公有項列表之上，如圖 14-2 所示：

<img alt="crate 整體注釋所渲染的 HTML 文件" src="img/trpl14-02.png" class="center" />

<span class="caption">圖 14-2：包含 `my_crate` 整體描述的注釋所渲染的文件</span>

位於項之中的文件注釋對於描述 crate 和模組特別有用。使用他們描述其容器整體的目的來幫助 crate 用戶理解你的代碼組織。

### 使用 `pub use` 導出合適的公有 API

第七章介紹了如何使用 `mod` 關鍵字來將代碼組織進模組中，如何使用 `pub` 關鍵字將項變為公有，和如何使用 `use` 關鍵字將項引入作用域。然而你開發時候使用的文件架構可能並不方便用戶。你的結構可能是一個包含多個層級的分層結構，不過這對於用戶來說並不方便。這是因為想要使用被定義在很深層級中的類型的人可能很難發現這些類型的存在。他們也可能會厭煩使用 `use my_crate::some_module::another_module::UsefulType;` 而不是 `use my_crate::UsefulType;` 來使用類型。

公有 API 的結構是你發布 crate 時主要需要考慮的。crate 用戶沒有你那麼熟悉其結構，並且如果模組層級過大他們可能會難以找到所需的部分。

好消息是，即使文件結構對於用戶來說 **不是** 很方便，你也無需重新安排內部組織：你可以選擇使用 `pub use` 重導出（re-export）項來使公有結構不同於私有結構。重導出獲取位於一個位置的公有項並將其公開到另一個位置，好像它就定義在這個新位置一樣。

例如，假設我們創建了一個描述美術訊息的庫 `art`。這個庫中包含了一個有兩個枚舉 `PrimaryColor` 和 `SecondaryColor` 的模組 `kinds`，以及一個包含函數 `mix` 的模組 `utils`，如範例 14-3 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
//! # Art
//!
//! A library for modeling artistic concepts.

pub mod kinds {
    /// The primary colors according to the RYB color model.
    pub enum PrimaryColor {
        Red,
        Yellow,
        Blue,
    }

    /// The secondary colors according to the RYB color model.
    pub enum SecondaryColor {
        Orange,
        Green,
        Purple,
    }
}

pub mod utils {
    use crate::kinds::*;

    /// Combines two primary colors in equal amounts to create
    /// a secondary color.
    pub fn mix(c1: PrimaryColor, c2: PrimaryColor) -> SecondaryColor {
        // --snip--
#         SecondaryColor::Orange
    }
}
# fn main() {}
```

<span class="caption">範例 14-3：一個庫 `art` 其組織包含 `kinds` 和 `utils` 模組</span>

`cargo doc` 所生成的 crate 文件首頁如圖 14-3 所示：

<img alt="包含 `kinds` 和 `utils` 模組的 `art`" src="img/trpl14-03.png" class="center" />

<span class="caption">圖 14-3：包含 `kinds` 和 `utils` 模組的庫 `art` 的文件首頁</span>

注意 `PrimaryColor` 和 `SecondaryColor` 類型、以及 `mix` 函數都沒有在首頁中列出。我們必須點擊 `kinds` 或 `utils` 才能看到他們。

另一個依賴這個庫的 crate 需要 `use` 語句來導入 `art` 中的項，這包含指定其當前定義的模組結構。範例 14-4 展示了一個使用 `art` crate 中 `PrimaryColor` 和 `mix` 項的 crate 的例子：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use art::kinds::PrimaryColor;
use art::utils::mix;

fn main() {
    let red = PrimaryColor::Red;
    let yellow = PrimaryColor::Yellow;
    mix(red, yellow);
}
```

<span class="caption">範例 14-4：一個透過導出內部結構使用 `art` crate 中項的 crate</span>

範例 14-4 中使用 `art` crate 代碼的作者不得不搞清楚 `PrimaryColor` 位於 `kinds` 模組而 `mix` 位於 `utils` 模組。`art` crate 的模組結構相比使用它的開發者來說對編寫它的開發者更有意義。其內部的 `kinds` 模組和 `utils` 模組的組織結構並沒有對嘗試理解如何使用它的人提供任何有價值的訊息。`art` crate 的模組結構因不得不搞清楚所需的內容在何處和必須在 `use` 語句中指定模組名稱而顯得混亂和不便。

為了從公有 API 中去掉 crate 的內部組織，我們可以採用範例 14-3 中的 `art` crate 並增加 `pub use` 語句來重導出項到頂層結構，如範例 14-5 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
//! # Art
//!
//! A library for modeling artistic concepts.

pub use self::kinds::PrimaryColor;
pub use self::kinds::SecondaryColor;
pub use self::utils::mix;

pub mod kinds {
    // --snip--
}

pub mod utils {
    // --snip--
}
```

<span class="caption">範例 14-5：增加 `pub use` 語句重導出項</span>

現在此 crate 由 `cargo doc` 生成的 API 文件會在首頁列出重導出的項以及其連結，如圖 14-4 所示，這使得 `PrimaryColor` 和 `SecondaryColor` 類型和 `mix` 函數更易於查找。

<img alt="Rendered documentation for the `art` crate with the re-exports on the front page" src="img/trpl14-04.png" class="center" />

<span class="caption">圖 14-10：`art` 文件的首頁，這裡列出了重導出的項</span>

`art` crate 的用戶仍然可以看見和選擇使用範例 14-4 中的內部結構，或者可以使用範例 14-5 中更為方便的結構，如範例 14-6 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use art::PrimaryColor;
use art::mix;

fn main() {
    // --snip--
}
```

<span class="caption">範例 14-6：一個使用 `art` crate 中重導出項的程序</span>

對於有很多嵌套模組的情況，使用 `pub use` 將類型重導出到頂級結構對於使用 crate 的人來說將會是大為不同的體驗。

創建一個有用的公有 API 結構更像是一門藝術而非科學，你可以反覆檢視他們來找出最適合用戶的 API。`pub use` 提供了解耦組織 crate 內部結構和與終端用戶體現的靈活性。觀察一些你所安裝的 crate 的代碼來看看其內部結構是否不同於公有 API。

### 創建 Crates.io 帳號

在你可以發布任何 crate 之前，需要在 [crates.io](https://crates.io)<!-- ignore --> 上註冊帳號並獲取一個 API token。為此，訪問位於 [crates.io](https://crates.io)<!-- ignore --> 的首頁並使用 GitHub 帳號登陸。（目前 GitHub 帳號是必須的，不過將來該網站可能會支持其他創建帳號的方法）一旦登陸之後，查看位於 [https://crates.io/me/](https://crates.io/me/)<!-- ignore --> 的帳戶設置頁面並獲取 API token。接著使用該 API token 運行 `cargo login` 命令，像這樣：

```text
$ cargo login abcdefghijklmnopqrstuvwxyz012345
```

這個命令會通知 Cargo 你的 API token 並將其儲存在本地的 _~/.cargo/credentials_ 文件中。注意這個 token 是一個 **秘密**（**secret**）且不應該與其他人共享。如果因為任何原因與他人共享了這個訊息，應該立即到 [crates.io](https://crates.io)<!-- ignore --> 重新生成這個 token。

### 發布新 crate 之前

有了帳號之後，比如說你已經有一個希望發布的 crate。在發布之前，你需要在 crate 的 _Cargo.toml_ 文件的 `[package]` 部分增加一些本 crate 的元訊息（metadata）。

首先 crate 需要一個唯一的名稱。雖然在本地開發 crate 時，可以使用任何你喜歡的名稱。不過 [crates.io](https://crates.io)<!-- ignore --> 上的 crate 名稱遵守先到先得的分配原則。一旦某個 crate 名稱被使用，其他人就不能再發布這個名稱的 crate 了。請在網站上搜索你希望使用的名稱來找出它是否已被使用。如果沒有，修改 _Cargo.toml_ 中 `[package]` 裡的名稱為你希望用於發布的名稱，像這樣：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[package]
name = "guessing_game"
```

即使你選擇了一個唯一的名稱，如果此時嘗試運行 `cargo publish` 發布該 crate 的話，會得到一個警告接著是一個錯誤：

```text
$ cargo publish
    Updating registry `https://github.com/rust-lang/crates.io-index`
warning: manifest has no description, license, license-file, documentation,
homepage or repository.
--snip--
error: api errors: missing or empty metadata fields: description, license.
```

這是因為我們缺少一些關鍵訊息：關於該 crate 用途的描述和用戶可能在何種條款下使用該 crate 的 license。為了修正這個錯誤，需要在 _Cargo.toml_ 中引入這些訊息。

描述通常是一兩句話，因為它會出現在 crate 的搜索結果中和 crate 頁面裡。對於 `license` 欄位，你需要一個 **license 標識符值**（_license identifier value_）。[Linux 基金會的 Software Package Data Exchange (SPDX)][spdx] 列出了可以使用的標識符。例如，為了指定 crate 使用 MIT License，增加 `MIT` 標識符：

[spdx]: http://spdx.org/licenses/

<span class="filename">檔案名: Cargo.toml</span>

```toml
[package]
name = "guessing_game"
license = "MIT"
```

如果你希望使用不存在於 SPDX 的 license，則需要將 license 文本放入一個文件，將該文件包含進項目中，接著使用 `license-file` 來指定檔案名而不是使用 `license` 欄位。

關於項目所適用的 license 指導超出了本書的範疇。很多 Rust 社區成員選擇與 Rust 自身相同的 license，這是一個雙許可的 `MIT OR Apache-2.0`。這個實踐展示了也可以通過 `OR` 分隔為項目指定多個 license 標識符。

那麼，有了唯一的名稱、版本號、由 `cargo new` 新建項目時增加的作者訊息、描述和所選擇的 license，已經準備好發布的項目的 _Cargo.toml_ 文件可能看起來像這樣：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[package]
name = "guessing_game"
version = "0.1.0"
authors = ["Your Name <you@example.com>"]
edition = "2018"
description = "A fun game where you guess what number the computer has chosen."
license = "MIT OR Apache-2.0"

[dependencies]
```

[Cargo 的文件](http://doc.rust-lang.org/cargo/) 描述了其他可以指定的元訊息，他們可以幫助你的 crate 更容易被發現和使用！

### 發布到 Crates.io

現在我們創建了一個帳號，保存了 API token，為 crate 選擇了一個名字，並指定了所需的元數據，你已經準備好發布了！發布 crate 會上傳特定版本的 crate 到 [crates.io](https://crates.io)<!-- ignore --> 以供他人使用。

發布 crate 時請多加小心，因為發布是 **永久性的**（_permanent_）。對應版本不可能被覆蓋，其代碼也不可能被刪除。[crates.io](https://crates.io)<!-- ignore --> 的一個主要目標是作為一個存儲代碼的永久文件伺服器，這樣所有依賴 [crates.io](https://crates.io)<!-- ignore --> 中的 crate 的項目都能一直正常工作。而允許刪除版本沒辦法達成這個目標。然而，可以被發布的版本號卻沒有限制。

再次運行 `cargo publish` 命令。這次它應該會成功：

```text
$ cargo publish
 Updating registry `https://github.com/rust-lang/crates.io-index`
Packaging guessing_game v0.1.0 (file:///projects/guessing_game)
Verifying guessing_game v0.1.0 (file:///projects/guessing_game)
Compiling guessing_game v0.1.0
(file:///projects/guessing_game/target/package/guessing_game-0.1.0)
 Finished dev [unoptimized + debuginfo] target(s) in 0.19 secs
Uploading guessing_game v0.1.0 (file:///projects/guessing_game)
```

恭喜！你現在向 Rust 社區分享了代碼，而且任何人都可以輕鬆的將你的 crate 加入他們項目的依賴。

### 發布現存 crate 的新版本

當你修改了 crate 並準備好發布新版本時，改變 _Cargo.toml_ 中 `version` 所指定的值。請使用 [語義化版本規則][semver] 來根據修改的類型決定下一個版本號。接著運行 `cargo publish` 來上傳新版本。

[semver]: http://semver.org/

### 使用 `cargo yank` 從 Crates.io 撤回版本

雖然你不能刪除之前版本的 crate，但是可以阻止任何將來的項目將他們加入到依賴中。這在某個版本因為這樣或那樣的原因被破壞的情況很有用。對於這種情況，Cargo 支持 **撤回**（_yanking_）某個版本。

撤回某個版本會阻止新項目開始依賴此版本，不過所有現存此依賴的項目仍然能夠下載和依賴這個版本。從本質上說，撤回意味著所有帶有 _Cargo.lock_ 的項目的依賴不會被破壞，同時任何新生成的 _Cargo.lock_ 將不能使用被撤回的版本。

為了撤回一個 crate，運行 `cargo yank` 並指定希望撤回的版本：

```text
$ cargo yank --vers 1.0.1
```

也可以撤銷撤回操作，並允許項目可以再次開始依賴某個版本，通過在命令上增加 `--undo`：

```text
$ cargo yank --vers 1.0.1 --undo
```

撤回 **並沒有** 刪除任何代碼。舉例來說，撤回功能並不意在刪除不小心上傳的秘密訊息。如果出現了這種情況，請立即重新設置這些秘密訊息。

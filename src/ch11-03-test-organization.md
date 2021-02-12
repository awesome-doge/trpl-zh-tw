## 測試的組織結構

> [ch11-03-test-organization.md](https://github.com/rust-lang/book/blob/master/src/ch11-03-test-organization.md)
> <br>
> commit 4badf9a8574c12794795b05954baf5adc579fa90

本章一開始就提到，測試是一個複雜的概念，而且不同的開發者也採用不同的技術和組織。Rust 社區傾向於根據測試的兩個主要分類來考慮問題：**單元測試**（*unit tests*）與 **集成測試**（*integration tests*）。單元測試傾向於更小而更集中，在隔離的環境中一次測試一個模組，或者是測試私有介面。而集成測試對於你的庫來說則完全是外部的。它們與其他外部代碼一樣，透過相同的方式使用你的代碼，只測試公有介面而且每個測試都有可能會測試多個模組。

為了保證你的庫能夠按照你的預期運行，從獨立和整體的角度編寫這兩類測試都是非常重要的。

### 單元測試

單元測試的目的是在與其他部分隔離的環境中測試每一個單元的代碼，以便於快速而準確的某個單元的代碼功能是否符合預期。單元測試與他們要測試的代碼共同存放在位於 *src* 目錄下相同的文件中。規範是在每個文件中創建包含測試函數的 `tests` 模組，並使用 `cfg(test)` 標註模組。

#### 測試模組和 `#[cfg(test)]`

測試模組的 `#[cfg(test)]` 註解告訴 Rust 只在執行 `cargo test` 時才編譯和運行測試代碼，而在運行 `cargo build` 時不這麼做。這在只希望構建庫的時候可以節省編譯時間，並且因為它們並沒有包含測試，所以能減少編譯產生的文件的大小。與之對應的集成測試因為位於另一個文件夾，所以它們並不需要 `#[cfg(test)]` 註解。然而單元測試位於與原始碼相同的文件中，所以你需要使用 `#[cfg(test)]` 來指定他們不應該被包含進編譯結果中。

回憶本章第一部分新建的 `adder` 項目，Cargo 為我們生成了如下代碼：

<span class="filename">檔案名: src/lib.rs</span>

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

上述代碼就是自動生成的測試模組。`cfg` 屬性代表 *configuration* ，它告訴 Rust 其之後的項只應該被包含進特定配置選項中。在這個例子中，配置選項是 `test`，即 Rust 所提供的用於編譯和運行測試的配置選項。透過使用 `cfg` 屬性，Cargo 只會在我們主動使用 `cargo test` 運行測試時才編譯測試代碼。需要編譯的不僅僅有標註為 `#[test]` 的函數之外，還包括測試模組中可能存在的幫助函數。

#### 測試私有函數

測試社區中一直存在關於是否應該對私有函數直接進行測試的論戰，而在其他語言中想要測試私有函數是一件困難的，甚至是不可能的事。不過無論你堅持哪種測試意識形態，Rust 的私有性規則確實允許你測試私有函數。考慮範例 11-12 中帶有私有函數 `internal_adder` 的代碼：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}

pub fn add_two(a: i32) -> i32 {
    internal_adder(a, 2)
}

fn internal_adder(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

<span class="caption">範例 11-12：測試私有函數</span>

注意 `internal_adder` 函數並沒有標記為 `pub`，不過因為測試也不過是 Rust 代碼同時 `tests` 也僅僅是另一個模組，我們完全可以在測試中導入和調用 `internal_adder`。如果你並不認為應該測試私有函數，Rust 也不會強迫你這麼做。

### 集成測試

在 Rust 中，集成測試對於你需要測試的庫來說完全是外部的。同其他使用庫的代碼一樣使用庫文件，也就是說它們只能調用一部分庫中的公有 API 。集成測試的目的是測試庫的多個部分能否一起正常工作。一些單獨能正確運行的代碼單元集成在一起也可能會出現問題，所以集成測試的覆蓋率也是很重要的。為了創建集成測試，你需要先創建一個 *tests* 目錄。

#### *tests* 目錄

為了編寫集成測試，需要在項目根目錄創建一個 *tests* 目錄，與 *src* 同級。Cargo 知道如何去尋找這個目錄中的集成測試文件。接著可以隨意在這個目錄中創建任意多的測試文件，Cargo 會將每一個文件當作單獨的 crate 來編譯。

讓我們來創建一個集成測試。保留範例 11-12 中 *src/lib.rs* 的代碼。創建一個 *tests* 目錄，新建一個文件 *tests/integration_test.rs*，並輸入範例 11-13 中的代碼。

<span class="filename">檔案名: tests/integration_test.rs</span>

```rust,ignore
use adder;

#[test]
fn it_adds_two() {
    assert_eq!(4, adder::add_two(2));
}
```

<span class="caption">範例 11-13：一個 `adder` crate 中函數的集成測試</span>

與單元測試不同，我們需要在文件頂部添加 `use adder`。這是因為每一個 `tests` 目錄中的測試文件都是完全獨立的 crate，所以需要在每一個文件中導入庫。

並不需要將 *tests/integration_test.rs* 中的任何代碼標註為 `#[cfg(test)]`。 `tests` 文件夾在 Cargo 中是一個特殊的文件夾， Cargo 只會在運行 `cargo test` 時編譯這個目錄中的文件。現在就運行 `cargo test` 試試：

```text
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running target/debug/deps/adder-abcabcabc

running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

     Running target/debug/deps/integration_test-ce99bcc2479f4607

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

現在有了三個部分的輸出：單元測試、集成測試和文件測試。第一部分單元測試與我們之前見過的一樣：每個單元測試一行（範例 11-12 中有一個叫做 `internal` 的測試），接著是一個單元測試的摘要行。

集成測試部分以行 `Running target/debug/deps/integration-test-ce99bcc2479f4607`（在輸出最後的哈希值可能不同）開頭。接下來每一行是一個集成測試中的測試函數，以及一個位於 `Doc-tests adder` 部分之前的集成測試的摘要行。

我們已經知道，單元測試函數越多，單元測試部分的結果行就會越多。同樣的，在集成文件中增加的測試函數越多，也會在對應的測試結果部分增加越多的結果行。每一個集成測試文件有對應的測試結果部分，所以如果在 *tests* 目錄中增加更多文件，測試結果中就會有更多集成測試結果部分。

我們仍然可以通過指定測試函數的名稱作為 `cargo test` 的參數來運行特定集成測試。也可以使用 `cargo test` 的 `--test` 後跟文件的名稱來運行某個特定集成測試文件中的所有測試：

```text
$ cargo test --test integration_test
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running target/debug/integration_test-952a27e0126bb565

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

這個命令只運行了 *tests* 目錄中我們指定的文件 `integration_test.rs` 中的測試。

#### 集成測試中的子模組

隨著集成測試的增加，你可能希望在 `tests` 目錄增加更多文件以便更好的組織他們，例如根據測試的功能來將測試分組。正如我們之前提到的，每一個 *tests* 目錄中的文件都被編譯為單獨的 crate。

將每個集成測試文件當作其自己的 crate 來對待，這更有助於創建單獨的作用域，這種單獨的作用域能提供更類似與最終使用者使用 crate 的環境。然而，正如你在第七章中學習的如何將代碼分為模組和文件的知識，*tests* 目錄中的文件不能像 *src* 中的文件那樣共享相同的行為。

當你有一些在多個集成測試文件都會用到的幫助函數，而你嘗試按照第七章 “將模組移動到其他文件” 部分的步驟將他們提取到一個通用的模組中時， *tests* 目錄中不同文件的行為就會顯得很明顯。例如，如果我們可以創建 一個*tests/common.rs* 文件並創建一個名叫 `setup` 的函數，我們希望這個函數能被多個測試文件的測試函數調用：

<span class="filename">檔案名: tests/common.rs</span>

```rust
pub fn setup() {
    // 編寫特定庫測試所需的代碼
}
```

如果再次運行測試，將會在測試結果中看到一個新的對應 *common.rs* 文件的測試結果部分，即便這個文件並沒有包含任何測試函數，也沒有任何地方調用了 `setup` 函數：

```text
running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

     Running target/debug/deps/common-b8b07b6f1be2db70

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

     Running target/debug/deps/integration_test-d993c68b431d39df

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

我們並不想要`common` 出現在測試結果中顯示 `running 0 tests` 。我們只是希望其能被其他多個集成測試文件中調用罷了。

為了不讓 `common` 出現在測試輸出中，我們將創建 *tests/common/mod.rs* ，而不是創建 *tests/common.rs* 。這是一種 Rust 的命名規範，這樣命名告訴 Rust 不要將 `common` 看作一個集成測試文件。將 `setup` 函數代碼移動到 *tests/common/mod.rs* 並刪除 *tests/common.rs* 文件之後，測試輸出中將不會出現這一部分。*tests* 目錄中的子目錄不會被作為單獨的 crate 編譯或作為一個測試結果部分出現在測試輸出中。

一旦擁有了 *tests/common/mod.rs*，就可以將其作為模組以便在任何集成測試文件中使用。這裡是一個 *tests/integration_test.rs* 中調用 `setup` 函數的 `it_adds_two` 測試的例子：

<span class="filename">檔案名: tests/integration_test.rs</span>

```rust,ignore
use adder;

mod common;

#[test]
fn it_adds_two() {
    common::setup();
    assert_eq!(4, adder::add_two(2));
}
```

注意 `mod common;` 聲明與範例 7-25 中展示的模組聲明相同。接著在測試函數中就可以調用 `common::setup()` 了。

#### 二進位制 crate 的集成測試

如果項目是二進位制 crate 並且只包含 *src/main.rs* 而沒有 *src/lib.rs*，這樣就不可能在 *tests* 目錄創建集成測試並使用 `extern crate` 導入 *src/main.rs* 中定義的函數。只有庫 crate 才會向其他 crate 暴露了可供調用和使用的函數；二進位制 crate 只意在單獨運行。

為什麼 Rust 二進位制項目的結構明確採用 *src/main.rs* 調用 *src/lib.rs* 中的邏輯的方式？因為通過這種結構，集成測試 **就可以** 通過 `extern crate` 測試庫 crate 中的主要功能了，而如果這些重要的功能沒有問題的話，*src/main.rs* 中的少量代碼也就會正常工作且不需要測試。

## 總結

Rust 的測試功能提供了一個確保即使你改變了函數的實現方式，也能繼續以期望的方式運行的途徑。單元測試獨立地驗證庫的不同部分，也能夠測試私有函數實現細節。集成測試則檢查多個部分是否能結合起來正確地工作，並像其他外部代碼那樣測試庫的公有 API。即使 Rust 的類型系統和所有權規則可以幫助避免一些 bug，不過測試對於減少代碼中不符合期望行為的邏輯 bug 仍然是很重要的。

讓我們將本章和其他之前章節所學的知識組合起來，在下一章一起編寫一個項目！

[separating-modules-into-files]:
ch07-05-separating-modules-into-different-files.html

## Cargo 工作空間

> [ch14-03-cargo-workspaces.md](https://github.com/rust-lang/book/blob/master/src/ch14-03-cargo-workspaces.md)
> <br>
> commit 6d3e76820418f2d2bb203233c61d90390b5690f1

第十二章中，我們構建一個包含二進位制 crate 和庫 crate 的包。你可能會發現，隨著項目開發的深入，庫 crate 持續增大，而你希望將其進一步拆分成多個庫 crate。對於這種情況，Cargo 提供了一個叫 **工作空間**（*workspaces*）的功能，它可以幫助我們管理多個相關的協同開發的包。

### 創建工作空間

**工作空間** 是一系列共享同樣的 *Cargo.lock* 和輸出目錄的包。讓我們使用工作空間創建一個項目 —— 這裡採用常見的代碼以便可以關注工作空間的結構。有多種組織工作空間的方式；我們將展示一個常用方法。我們的工作空間有一個二進位制項目和兩個庫。二進位制項目會提供主要功能，並會依賴另兩個庫。一個庫會提供 `add_one` 方法而第二個會提供 `add_two` 方法。這三個 crate 將會是相同工作空間的一部分。讓我們以新建工作空間目錄開始：

```text
$ mkdir add
$ cd add
```

接著在 *add* 目錄中，創建 *Cargo.toml* 文件。這個 *Cargo.toml* 文件配置了整個工作空間。它不會包含 `[package]` 或其他我們在 *Cargo.toml* 中見過的元訊息。相反，它以 `[workspace]` 部分作為開始，並通過指定 *adder* 的路徑來為工作空間增加成員，如下會加入二進位制 crate：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[workspace]

members = [
    "adder",
]
```

接下來，在 *add* 目錄運行 `cargo new` 新建 `adder` 二進位制 crate：

```text
$ cargo new adder
     Created binary (application) `adder` project
```

到此為止，可以運行 `cargo build` 來構建工作空間。*add* 目錄中的文件應該看起來像這樣：

```text
├── Cargo.lock
├── Cargo.toml
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

工作空間在頂級目錄有一個 *target* 目錄；`adder` 並沒有自己的 *target* 目錄。即使進入 *adder* 目錄運行 `cargo build`，構建結果也位於 *add/target* 而不是 *add/adder/target*。工作空間中的 crate 之間相互依賴。如果每個 crate 有其自己的 *target* 目錄，為了在自己的 *target* 目錄中生成構建結果，工作空間中的每一個 crate 都不得不相互重新編譯其他 crate。通過共享一個 *target* 目錄，工作空間可以避免其他 crate 多餘的重複構建。

### 在工作空間中創建第二個 crate

接下來，讓我們在工作空間中指定另一個成員 crate。這個 crate 位於 *add-one* 目錄中，所以修改頂級 *Cargo.toml* 為也包含 *add-one* 路徑：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[workspace]

members = [
    "adder",
    "add-one",
]
```

接著新生成一個叫做 `add-one` 的庫：

```text
$ cargo new add-one --lib
     Created library `add-one` project
```

現在 *add* 目錄應該有如下目錄和文件：

```text
├── Cargo.lock
├── Cargo.toml
├── add-one
│   ├── Cargo.toml
│   └── src
│       └── lib.rs
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

在 *add-one/src/lib.rs* 文件中，增加一個 `add_one` 函數：

<span class="filename">檔案名: add-one/src/lib.rs</span>

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

現在工作空間中有了一個庫 crate，讓 `adder` 依賴庫 crate `add-one`。首先需要在 *adder/Cargo.toml* 文件中增加 `add-one` 作為路徑依賴：

<span class="filename">檔案名: adder/Cargo.toml</span>

```toml
[dependencies]

add-one = { path = "../add-one" }
```

cargo並不假定工作空間中的Crates會相互依賴，所以需要明確表明工作空間中 crate 的依賴關係。

接下來，在 `adder` crate 中使用 `add-one` crate 的函數 `add_one`。打開 *adder/src/main.rs* 在頂部增加一行 `use` 將新 `add-one` 庫 crate 引入作用域。接著修改 `main` 函數來調用 `add_one` 函數，如範例 14-7 所示。

<span class="filename">檔案名: adder/src/main.rs</span>

```rust,ignore
use add_one;

fn main() {
    let num = 10;
    println!("Hello, world! {} plus one is {}!", num, add_one::add_one(num));
}
```

<span class="caption">範例 14-7：在 `adder` crate 中使用 `add-one` 庫 crate</span>

在 *add* 目錄中運行 `cargo build` 來構建工作空間！

```text
$ cargo build
   Compiling add-one v0.1.0 (file:///projects/add/add-one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 0.68 secs
```

為了在頂層 *add* 目錄運行二進位制 crate，需要通過 `-p` 參數和包名稱來運行 `cargo run` 指定工作空間中我們希望使用的包：

```text
$ cargo run -p adder
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/adder`
Hello, world! 10 plus one is 11!
```

這會運行 *adder/src/main.rs* 中的代碼，其依賴 `add-one` crate


#### 在工作空間中依賴外部 crate

還需注意的是工作空間只在根目錄有一個 *Cargo.lock*，而不是在每一個 crate 目錄都有 *Cargo.lock*。這確保了所有的 crate 都使用完全相同版本的依賴。如果在 *Cargo.toml* 和 *add-one/Cargo.toml* 中都增加 `rand` crate，則 Cargo 會將其都解析為同一版本並記錄到唯一的 *Cargo.lock* 中。使得工作空間中的所有 crate 都使用相同的依賴意味著其中的 crate 都是相互相容的。讓我們在 *add-one/Cargo.toml* 中的 `[dependencies]` 部分增加 `rand` crate 以便能夠在 `add-one` crate 中使用 `rand` crate：

<span class="filename">檔案名: add-one/Cargo.toml</span>

```toml
[dependencies]
rand = "0.5.5"
```

現在就可以在 *add-one/src/lib.rs* 中增加 `use rand;` 了，接著在 *add* 目錄運行 `cargo build` 構建整個工作空間就會引入並編譯 `rand` crate：

```text
$ cargo build
    Updating crates.io index
  Downloaded rand v0.5.5
   --snip--
   Compiling rand v0.5.5
   Compiling add-one v0.1.0 (file:///projects/add/add-one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 10.18 secs
```

現在頂級的 *Cargo.lock* 包含了 `add-one` 的 `rand` 依賴的訊息。然而，即使 `rand` 被用於工作空間的某處，也不能在其他 crate 中使用它，除非也在他們的 *Cargo.toml* 中加入 `rand`。例如，如果在頂級的 `adder` crate 的 *adder/src/main.rs* 中增加 `use rand;`，會得到一個錯誤：

```text
$ cargo build
   Compiling adder v0.1.0 (file:///projects/add/adder)
error: use of unstable library feature 'rand': use `rand` from crates.io (see
issue #27703)
 --> adder/src/main.rs:1:1
  |
1 | use rand;
```

為了修復這個錯誤，修改頂級 `adder` crate 的 *Cargo.toml* 來表明 `rand` 也是這個 crate 的依賴。構建 `adder` crate 會將 `rand` 加入到 *Cargo.lock* 中 `adder` 的依賴列表中，但是這並不會下載 `rand` 的額外拷貝。Cargo 確保了工作空間中任何使用 `rand` 的 crate 都採用相同的版本。在整個工作空間中使用相同版本的 `rand` 節省了空間，因為這樣就無需多個拷貝並確保了工作空間中的 crate 將是相互相容的。

#### 為工作空間增加測試

作為另一個提升，讓我們為 `add_one` crate 中的 `add_one::add_one` 函數增加一個測試：

<span class="filename">檔案名: add-one/src/lib.rs</span>

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(3, add_one(2));
    }
}
```

在頂級 *add* 目錄運行 `cargo test`：

```text
$ cargo test
   Compiling add-one v0.1.0 (file:///projects/add/add-one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 0.27 secs
     Running target/debug/deps/add_one-f0253159197f7841

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

     Running target/debug/deps/adder-f88af9d2cc175a5e

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

   Doc-tests add-one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

輸出的第一部分顯示 `add-one` crate 的 `it_works` 測試通過了。下一個部分顯示 `adder` crate 中找到了 0 個測試，最後一部分顯示 `add-one` crate 中有 0 個文件測試。在像這樣的工作空間結構中運行 `cargo test` 會運行工作空間中所有 crate 的測試。

也可以選擇運行工作空間中特定 crate 的測試，透過在根目錄使用 `-p` 參數並指定希望測試的 crate 名稱：

```text
$ cargo test -p add-one
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running target/debug/deps/add_one-b3235fea9a156f74

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

   Doc-tests add-one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

輸出顯示了 `cargo test` 只運行了 `add-one` crate 的測試而沒有運行 `adder` crate 的測試。

如果你選擇向 [crates.io](https://crates.io/)發布工作空間中的 crate，每一個工作空間中的 crate 需要單獨發布。`cargo publish` 命令並沒有 `--all` 或者 `-p` 參數，所以必須進入每一個 crate 的目錄並運行 `cargo publish` 來發布工作空間中的每一個 crate。

現在嘗試以類似 `add-one` crate 的方式向工作空間增加 `add-two` crate 來作為更多的練習！

隨著項目增長，考慮使用工作空間：每一個更小的組件比一大塊代碼要容易理解。如果它們經常需要同時被修改的話，將 crate 保持在工作空間中更易於協調他們的改變。

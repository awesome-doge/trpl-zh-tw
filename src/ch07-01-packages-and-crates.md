## 包和 crate

> [ch07-01-packages-and-crates.md](https://github.com/rust-lang/book/blob/master/src/ch07-01-packages-and-crates.md)
> <br>
> commit 879fef2345bf32751a83a9e779e0cb84e79b6d3d

模組系統的第一部分，我們將介紹包和 crate。crate 是一個二進位制項或者庫。*crate root* 是一個源文件，Rust 編譯器以它為起始點，並構成你的 crate 的根模組（我們將在 “[定義模組來控制作用域與私有性](https://github.com/rust-lang/book/blob/master/src/ch07-02-defining-modules-to-control-scope-and-privacy.md)” 一節深入解讀）。*包*（*package*） 是提供一系列功能的一個或者多個 crate。一個包會包含有一個 *Cargo.toml* 文件，闡述如何去構建這些 crate。

包中所包含的內容由幾條規則來確立。一個包中至多 **只能** 包含一個庫 crate(library crate)；包中可以包含任意多個二進位制 crate(binary crate)；包中至少包含一個 crate，無論是庫的還是二進位制的。

讓我們來看看創建包的時候會發生什麼事。首先，我們輸入命令 `cargo new`：

```text
$ cargo new my-project
     Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-project/src
main.rs
```

當我們輸入了這條命令，Cargo 會給我們的包創建一個 *Cargo.toml* 文件。查看 *Cargo.toml* 的內容，會發現並沒有提到 *src/main.rs*，因為 Cargo 遵循的一個約定：*src/main.rs* 就是一個與包同名的二進位制 crate 的 crate 根。同樣的，Cargo 知道如果包目錄中包含 *src/lib.rs*，則包帶有與其同名的庫 crate，且 *src/lib.rs* 是 crate 根。crate 根文件將由 Cargo 傳遞給 `rustc` 來實際構建庫或者二進位制項目。

在此，我們有了一個只包含 *src/main.rs* 的包，意味著它只含有一個名為 `my-project` 的二進位制 crate。如果一個包同時含有 *src/main.rs* 和 *src/lib.rs*，則它有兩個 crate：一個庫和一個二進位制項，且名字都與包相同。透過將文件放在 *src/bin* 目錄下，一個包可以擁有多個二進位制 crate：每個 *src/bin* 下的文件都會被編譯成一個獨立的二進位制 crate。

一個 crate 會將一個作用域內的相關功能分組到一起，使得該功能可以很方便地在多個項目之間共享。舉一個例子，我們在 [第二章](https://github.com/rust-lang/book/blob/master/src/ch02-00-guessing-game-tutorial.md#generating-a-random-number) 使用的 `rand` crate 提供了生成隨機數的功能。透過將 `rand` crate 加入到我們項目的作用域中，我們就可以在自己的項目中使用該功能。`rand` crate 提供的所有功能都可以通過該 crate 的名字：`rand` 進行訪問。

將一個 crate 的功能保持在其自身的作用域中，可以知曉一些特定的功能是在我們的 crate 中定義的還是在 `rand` crate 中定義的，這可以防止潛在的衝突。例如，`rand` crate 提供了一個名為 `Rng` 的特性（trait）。我們還可以在我們自己的 crate 中定義一個名為 `Rng` 的 `struct`。因為一個 crate 的功能是在自身的作用域進行命名的，當我們將 `rand` 作為一個依賴，編譯器不會混淆 `Rng` 這個名字的指向。在我們的 crate 中，它指向的是我們自己定義的 `struct Rng`。我們可以通過 `rand::Rng` 這一方式來訪問 `rand` crate 中的 `Rng` 特性（trait）。

接下來讓我們來說一說模組系統！

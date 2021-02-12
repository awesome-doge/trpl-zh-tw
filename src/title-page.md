# Rust 程式設計語言

> [title-page.md](https://github.com/rust-lang/book/blob/master/src/title-page.md) <br>
> commit a2bd349f8654f5c45ad1f07394225f946954b8ef

**Steve Klabnik 和 Carol Nichols，以及來自 Rust 社區的貢獻（Rust 中文社區翻譯）**

本書假設你使用 Rust 1.41.0 或更新的版本，且在所有的項目中的 *Cargo.toml* 文件中通過 `edition="2018"` 採用 Rust 2018 Edition 規範。請查看 [第一章的 “安裝” 部分][install] 了解如何安裝和升級 Rust，並查看新的 [附錄 E][editions] 了解版本相關的訊息。

Rust 程式設計語言的 2018 Edition 包含許多的改進使得 Rust 更為工程化並更為容易學習。本書的此次疊代包括了很多反映這些改進的修改：

- 第七章 “使用包、Crate 和模組管理不斷增長的項目” 基本上被重寫了。模組系統和路徑（path）的工作方式變得更為一致。
- 第十章新增了名為 “trait 作為參數” 和 “返回實現了 trait 的類型” 部分來解釋新的 `impl Trait` 語法。
- 第十一章新增了一個名為 “在測試中使用 `Result<T, E>`” 的部分來展示如何使用 `?` 運算符來編寫測試
- 第十九章的 “高級生命週期” 部分被移除了，因為編譯器的改進使得其內容變得更為少見。
- 之前的附錄 D “宏” 得到了補充，包括了過程宏並移動到了第十九章的 “宏” 部分。
- 附錄 A “關鍵字” 也介紹了新的原始標識符（raw identifiers）功能，這使得採用 2015 Edition 編寫的 Rust 代碼可以與 2018 Edition 互通。
- 現在的附錄 D 名為 “實用開發工具”，它介紹了最近發布的可以幫助你編寫 Rust 代碼的工具。
- 我們還修復了全書中許多錯誤和不準確的描述。感謝報告了這些問題的讀者們！

注意任何 “Rust 程式設計語言” 早期疊代中的代碼在項目的 *Cargo.toml* 中不包含 `edition="2018"` 時仍可以繼續編譯，哪怕你更新了 Rust 編譯器的版本。Rust 的後向相容性保證了這一切可以正常運行！

本書的 HTML 版本可以在 [https://doc.rust-lang.org/stable/book/](https://doc.rust-lang.org/stable/book/) （[簡體中文譯本](https://kaisery.github.io/trpl-zh-cn/)）線上閱讀，離線版則包含在通過 `rustup` 安裝的 Rust 中；運行 `rustup docs --book` 可以打開。

本書的 [紙質版和電子書由 No Starch Press][nsprust] 發行。

[install]: ch01-01-installation.html
[editions]: appendix-05-editions.html
[nsprust]: https://nostarch.com/rust

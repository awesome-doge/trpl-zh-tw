# Rust 程式設計語言

[Rust 程式設計語言](title-page.md)
[前言](foreword.md)
[介紹](ch00-00-introduction.md)

## 入門指南

- [入門指南](ch01-00-getting-started.md)
    - [安裝](ch01-01-installation.md)
    - [Hello, World!](ch01-02-hello-world.md)
    - [Hello, Cargo!](ch01-03-hello-cargo.md)

- [猜猜看遊戲教學](ch02-00-guessing-game-tutorial.md)

- [常見編程概念](ch03-00-common-programming-concepts.md)
    - [變數與可變性](ch03-01-variables-and-mutability.md)
    - [數據類型](ch03-02-data-types.md)
    - [函數如何工作](ch03-03-how-functions-work.md)
    - [注釋](ch03-04-comments.md)
    - [控制流](ch03-05-control-flow.md)

- [認識所有權](ch04-00-understanding-ownership.md)
    - [什麼是所有權？](ch04-01-what-is-ownership.md)
    - [引用與借用](ch04-02-references-and-borrowing.md)
    - [Slices](ch04-03-slices.md)

- [使用結構體來組織相關聯的數據](ch05-00-structs.md)
    - [定義並實例化結構體](ch05-01-defining-structs.md)
    - [一個使用結構體的範例程序](ch05-02-example-structs.md)
    - [方法語法](ch05-03-method-syntax.md)

- [枚舉與模式匹配](ch06-00-enums.md)
    - [定義枚舉](ch06-01-defining-an-enum.md)
    - [`match` 控制流運算符](ch06-02-match.md)
    - [`if let` 簡潔控制流](ch06-03-if-let.md)

## 基本 Rust 技能

- [使用包、Crate 和模組管理不斷增長的項目](ch07-00-managing-growing-projects-with-packages-crates-and-modules.md)
    - [包和 crate](ch07-01-packages-and-crates.md)
    - [定義模組來控制作用域與私有性](ch07-02-defining-modules-to-control-scope-and-privacy.md)
    - [路徑用於引用模組樹中的項](ch07-03-paths-for-referring-to-an-item-in-the-module-tree.md)
    - [使用 `use` 關鍵字將名稱引入作用域](ch07-04-bringing-paths-into-scope-with-the-use-keyword.md)
    - [將模組分割進不同文件](ch07-05-separating-modules-into-different-files.md)

- [常見集合](ch08-00-common-collections.md)
    - [vector](ch08-01-vectors.md)
    - [字串](ch08-02-strings.md)
    - [哈希 map](ch08-03-hash-maps.md)

- [錯誤處理](ch09-00-error-handling.md)
    - [`panic!` 與不可恢復的錯誤](ch09-01-unrecoverable-errors-with-panic.md)
    - [`Result` 與可恢復的錯誤](ch09-02-recoverable-errors-with-result.md)
    - [`panic!` 還是不 `panic!`](ch09-03-to-panic-or-not-to-panic.md)

- [泛型、trait 與生命週期](ch10-00-generics.md)
    - [泛型數據類型](ch10-01-syntax.md)
    - [trait：定義共享的行為](ch10-02-traits.md)
    - [生命週期與引用有效性](ch10-03-lifetime-syntax.md)

- [測試](ch11-00-testing.md)
    - [編寫測試](ch11-01-writing-tests.md)
    - [運行測試](ch11-02-running-tests.md)
    - [測試的組織結構](ch11-03-test-organization.md)

- [一個 I/O 項目：構建命令行程序](ch12-00-an-io-project.md)
    - [接受命令行參數](ch12-01-accepting-command-line-arguments.md)
    - [讀取文件](ch12-02-reading-a-file.md)
    - [重構以改進模組化與錯誤處理](ch12-03-improving-error-handling-and-modularity.md)
    - [採用測試驅動開發完善庫的功能](ch12-04-testing-the-librarys-functionality.md)
    - [處理環境變數](ch12-05-working-with-environment-variables.md)
    - [將錯誤訊息輸出到標準錯誤而不是標準輸出](ch12-06-writing-to-stderr-instead-of-stdout.md)

## Rust 編程思想

- [Rust 中的函數式語言功能：疊代器與閉包](ch13-00-functional-features.md)
    - [閉包：可以捕獲其環境的匿名函數](ch13-01-closures.md)
    - [使用疊代器處理元素序列](ch13-02-iterators.md)
    - [改進之前的 I/O 項目](ch13-03-improving-our-io-project.md)
    - [性能比較：循環對疊代器](ch13-04-performance.md)

- [更多關於 Cargo 和 Crates.io 的內容](ch14-00-more-about-cargo.md)
    - [採用發布配置自訂構建](ch14-01-release-profiles.md)
    - [將 crate 發布到 Crates.io](ch14-02-publishing-to-crates-io.md)
    - [Cargo 工作空間](ch14-03-cargo-workspaces.md)
    - [使用 `cargo install` 從 Crates.io 安裝二進位制文件](ch14-04-installing-binaries.md)
    - [Cargo 自訂擴展命令](ch14-05-extending-cargo.md)

- [智慧指針](ch15-00-smart-pointers.md)
    - [`Box<T>` 指向堆上數據，並且可確定大小](ch15-01-box.md)
    - [通過 `Deref` trait 將智慧指針當作常規引用處理](ch15-02-deref.md)
    - [`Drop` Trait 運行清理代碼](ch15-03-drop.md)
    - [`Rc<T>` 引用計數智慧指針](ch15-04-rc.md)
    - [`RefCell<T>` 與內部可變性模式](ch15-05-interior-mutability.md)
    - [引用循環與記憶體洩漏是安全的](ch15-06-reference-cycles.md)

- [無畏並發](ch16-00-concurrency.md)
    - [執行緒](ch16-01-threads.md)
    - [消息傳遞](ch16-02-message-passing.md)
    - [共享狀態](ch16-03-shared-state.md)
    - [可擴展的並發：`Sync` 與 `Send`](ch16-04-extensible-concurrency-sync-and-send.md)

- [Rust 的面向對象編程特性](ch17-00-oop.md)
    - [面向對象語言的特點](ch17-01-what-is-oo.md)
    - [為使用不同類型的值而設計的 trait 對象](ch17-02-trait-objects.md)
    - [面向對象設計模式的實現](ch17-03-oo-design-patterns.md)

## 高級主題

- [模式用來匹配值的結構](ch18-00-patterns.md)
    - [所有可能會用到模式的位置](ch18-01-all-the-places-for-patterns.md)
    - [Refutability：何時模式可能會匹配失敗](ch18-02-refutability.md)
    - [模式的全部語法](ch18-03-pattern-syntax.md)

- [高級特徵](ch19-00-advanced-features.md)
    - [不安全的 Rust](ch19-01-unsafe-rust.md)
    - [高級 trait](ch19-03-advanced-traits.md)
    - [高級類型](ch19-04-advanced-types.md)
    - [高級函數與閉包](ch19-05-advanced-functions-and-closures.md)
    - [宏](ch19-06-macros.md)

- [最後的項目: 構建多執行緒 web server](ch20-00-final-project-a-web-server.md)
    - [單執行緒 web server](ch20-01-single-threaded.md)
    - [將單執行緒 server 變為多執行緒 server](ch20-02-multithreaded.md)
    - [優雅停機與清理](ch20-03-graceful-shutdown-and-cleanup.md)

- [附錄](appendix-00.md)
    - [A - 關鍵字](appendix-01-keywords.md)
    - [B - 運算符與符號](appendix-02-operators.md)
    - [C - 可派生的 trait](appendix-03-derivable-traits.md)
    - [D - 實用開發工具](appendix-04-useful-development-tools.md)
    - [E - 版本](appendix-05-editions.md)
    - [F - 本書譯本](appendix-06-translation.md)
    - [G - Rust 是如何開發的與 “Nightly Rust”](appendix-07-nightly-rust.md)

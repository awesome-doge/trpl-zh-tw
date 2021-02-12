# 高級特徵

> [ch19-00-advanced-features.md](https://github.com/rust-lang/book/blob/master/src/ch19-00-advanced-features.md)
> <br>
> commit 10f89936b02dc366a2d0b34083b97cadda9e0ce4

現在我們已經學習了 Rust 程式語言中最常用的部分。在第二十章開始另一個新項目之前，讓我們聊聊一些總有一天你會遇上的部分內容。你可以將本章作為不經意間遇到未知的內容時的參考。本章將要學習的功能在一些非常特定的場景下很有用處。雖然很少會碰到它們，我們希望確保你了解 Rust 提供的所有功能。

本章將涉及如下內容：

* 不安全 Rust：用於當需要捨棄 Rust 的某些保證並負責手動維持這些保證
* 高級 trait：與 trait 相關的關聯類型，默認類型參數，完全限定語法（fully qualified syntax），超（父）trait（supertraits）和 newtype 模式
* 高級類型：關於 newtype 模式的更多內容，類型別名，never 類型和動態大小類型
* 高級函數和閉包：函數指針和返回閉包
* 宏：定義在編譯時定義更多代碼的方式

對所有人而言，這都是一個介紹 Rust 迷人特性的寶典！讓我們翻開它吧！

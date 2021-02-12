# 使用結構體組織相關聯的數據

> [ch05-00-structs.md](https://github.com/rust-lang/book/blob/master/src/ch05-00-structs.md)
> <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

*struct*，或者 *structure*，是一個自訂數據類型，允許你命名和包裝多個相關的值，從而形成一個有意義的組合。如果你熟悉一門面向對象語言，*struct* 就像對象中的數據屬性。在本章中，我們會對比元組與結構體的異同，示範結構體的用法，並討論如何在結構體上定義方法和關聯函數來指定與結構體數據相關的行為。你可以在程序中基於結構體和枚舉（*enum*）（在第六章介紹）創建新類型，以充分利用 Rust 的編譯時類型檢查。

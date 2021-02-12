# 枚舉和模式匹配

> [ch06-00-enums.md](https://github.com/rust-lang/book/blob/master/src/ch06-00-enums.md)
> <br>
> commit a5a03d8f61a5b2c2111b21031a3f526ef60844dd

本章介紹 **枚舉**（*enumerations*），也被稱作 *enums*。枚舉允許你通過列舉可能的 **成員**（*variants*） 來定義一個類型。首先，我們會定義並使用一個枚舉來展示它是如何連同數據一起編碼訊息的。接下來，我們會探索一個特別有用的枚舉，叫做 `Option`，它代表一個值要嘛是某個值要嘛什麼都不是。然後會講到在 `match` 表達式中用模式匹配，針對不同的枚舉值編寫相應要執行的代碼。最後會介紹 `if let`，另一個簡潔方便處理代碼中枚舉的結構。

枚舉是一個很多語言都有的功能，不過不同語言中其功能各不相同。Rust 的枚舉與 F#、OCaml 和 Haskell 這樣的函數式程式語言中的 **代數數據類型**（*algebraic data types*）最為相似。

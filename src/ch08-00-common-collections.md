# 常見集合

> [ch08-00-common-collections.md](https://github.com/rust-lang/book/blob/master/src/ch08-00-common-collections.md)
> <br>
> commit 820ac357f6cf0e866e5a8e7a9c57dd3e17e9f8ca

Rust 標準庫中包含一系列被稱為 **集合**（*collections*）的非常有用的數據結構。大部分其他數據類型都代表一個特定的值，不過集合可以包含多個值。不同於內建的數組和元組類型，這些集合指向的數據是儲存在堆上的，這意味著數據的數量不必在編譯時就已知，並且還可以隨著程序的運行增長或縮小。每種集合都有著不同功能和成本，而根據當前情況選擇合適的集合，這是一項應當逐漸掌握的技能。在這一章裡，我們將詳細的了解三個在 Rust 程序中被廣泛使用的集合：

* *vector* 允許我們一個挨著一個地儲存一系列數量可變的值
* **字串**（*string*）是字元的集合。我們之前見過 `String` 類型，不過在本章我們將深入了解。
* **哈希 map**（*hash map*）允許我們將值與一個特定的鍵（key）相關聯。這是一個叫做 *map* 的更通用的數據結構的特定實現。

對於標準庫提供的其他類型的集合，請查看[文件][collections]。

[collections]: https://doc.rust-lang.org/std/collections

我們將討論如何創建和更新 vector、字串和哈希 map，以及它們有什麼特別之處。

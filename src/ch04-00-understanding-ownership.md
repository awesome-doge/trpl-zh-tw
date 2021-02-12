# 認識所有權

> [ch04-00-understanding-ownership.md](https://github.com/rust-lang/book/blob/master/src/ch04-00-understanding-ownership.md)
> <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

所有權（系統）是 Rust 最為與眾不同的特性，它讓 Rust 無需垃圾回收（garbage collector）即可保障記憶體安全。因此，理解 Rust 中所有權如何工作是十分重要的。本章，我們將講到所有權以及相關功能：借用、slice 以及 Rust 如何在記憶體中布局數據。

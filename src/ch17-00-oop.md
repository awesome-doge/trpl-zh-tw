# Rust 的面向對象特性

> [ch17-00-oop.md](https://github.com/rust-lang/book/blob/master/src/ch17-00-oop.md)
> <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

面向對象編程（Object-Oriented Programming，OOP）是一種模式化編程方式。對象（Object）來源於 20 世紀 60 年代的 Simula 程式語言。這些對象影響了 Alan Kay 的程式架構中對象之間的消息傳遞。他在 1967 年創造了 **面向對象編程** 這個術語來描述這種架構。關於 OOP 是什麼有很多相互矛盾的定義；在一些定義下，Rust 是面向對象的；在其他定義下，Rust 不是。在本章節中，我們會探索一些被普遍認為是面向對象的特性和這些特性是如何體現在 Rust 語言習慣中的。接著會展示如何在 Rust 中實現面向對象設計模式，並討論這麼做與利用 Rust 自身的一些優勢實現的方案相比有什麼取捨。

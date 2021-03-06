# 使用包、Crate和模組管理不斷增長的項目

> [ch07-00-managing-growing-projects-with-packages-crates-and-modules.md](https://github.com/rust-lang/book/blob/master/src/ch07-00-managing-growing-projects-with-packages-crates-and-modules.md)
> <br>
> commit 879fef2345bf32751a83a9e779e0cb84e79b6d3d

當你編寫大型程序時，組織你的代碼顯得尤為重要，因為你想在腦海中通曉整個程序，那幾乎是不可能完成的。通過對相關功能進行分組和劃分不同功能的代碼，你可以清楚在哪裡可以找到實現了特定功能的代碼，以及在哪裡可以改變一個功能的工作方式。

到目前為止，我們編寫的程序都在一個文件的一個模組中。伴隨著項目的增長，你可以透過將代碼分解為多個模組和多個文件來組織代碼。一個包可以包含多個二進位制 crate 項和一個可選的 crate 庫。伴隨著包的增長，你可以將包中的部分代碼提取出來，做成獨立的 crate，這些 crate 則作為外部依賴項。本章將會涵蓋所有這些概念。對於一個由一系列相互關聯的包組合而成的超大型項目，Cargo 提供了 “工作空間” 這一功能，我們將在第十四章的 “[Cargo Workspaces](ch14-03-cargo-workspaces.html)” 對此進行講解。

除了對功能進行分組以外，封裝實現細節可以使你更高級地重用代碼：你實現了一個操作後，其他的代碼可以透過該代碼的公共介面來進行調用，而不需要知道它是如何實現的。你在編寫程式碼時可以定義哪些部分是其他代碼可以使用的公共部分，以及哪些部分是你有權更改實現細節的私有部分。這是另一種減少你在腦海中記住項目內容數量的方法。

這裡有一個需要說明的概念 “作用域（scope）”：代碼所在的嵌套上下文有一組定義為 “in scope” 的名稱。當閱讀、編寫和編譯代碼時，程式設計師和編譯器需要知道特定位置的特定名稱是否引用了變數、函數、結構體、枚舉、模組、常量或者其他有意義的項。你可以創建作用域，以及改變哪些名稱在作用域內還是作用域外。同一個作用域內不能擁有兩個相同名稱的項；可以使用一些工具來解決名稱衝突。

Rust 有許多功能可以讓你管理代碼的組織，包括哪些內容可以被公開，哪些內容作為私有部分，以及程序每個作用域中的名字。這些功能。這有時被稱為 “模組系統（the module system）”，包括：

* **包**（*Packages*）： Cargo 的一個功能，它允許你構建、測試和分享 crate。
* **Crates** ：一個模組的樹形結構，它形成了庫或二進位制項目。
* **模組**（*Modules*）和 **use**： 允許你控制作用域和路徑的私有性。
* **路徑**（*path*）：一個命名例如結構體、函數或模組等項的方式

本章將會涵蓋所有這些概念，討論它們如何交互，並說明如何使用它們來管理作用域。到最後，你會對模組系統有深入的了解，並且能夠像專業人士一樣使用作用域！

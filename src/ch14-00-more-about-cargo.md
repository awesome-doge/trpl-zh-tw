# 進一步認識 Cargo 和 Crates.io

> [ch14-00-more-about-cargo.md](https://github.com/rust-lang/book/blob/master/src/ch14-00-more-about-cargo.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

目前為止我們只使用過 Cargo 構建、運行和測試代碼這些最基本的功能，不過它還可以做到更多。本章會討論 Cargo 其他一些更為高級的功能，我們將展示如何：

* 使用發布配置來自訂構建
* 將庫發布到 [crates.io](https://crates.io)
* 使用工作空間來組織更大的項目
* 從 [crates.io](https://crates.io) 安裝二進位制文件
* 使用自訂的命令來擴展 Cargo

Cargo 的功能不止本章所介紹的，關於其全部功能的詳盡解釋，請查看 [文件](http://doc.rust-lang.org/cargo/)

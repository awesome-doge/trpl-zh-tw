# 一個 I/O 項目：構建一個命令行程序

> [ch12-00-an-io-project.md](https://github.com/rust-lang/book/blob/master/src/ch12-00-an-io-project.md)
> <br>
> commit db919bc6bb9071566e9c4f05053672133eaac33e

本章既是一個目前所學的很多技能的概括，也是一個更多標準庫功能的探索。我們將構建一個與文件和命令行輸入/輸出交互的命令行工具來練習現在一些你已經掌握的 Rust 技能。

Rust 的運行速度、安全性、單二進位制文件輸出和跨平台支持使其成為創建命令行程序的絕佳選擇，所以我們的項目將創建一個我們自己版本的經典命令行工具：`grep`。grep 是 “**G**lobally search a **R**egular **E**xpression and **P**rint.” 的首字母縮寫。`grep` 最簡單的使用場景是在特定文件中搜尋指定字串。為此，`grep` 獲取一個檔案名和一個字串作為參數，接著讀取文件並找到其中包含字串參數的行，然後列印出這些行。

在這個過程中，我們會展示如何讓我們的命令行工具利用很多命令行工具中用到的終端功能。讀取環境變數來使得用戶可以配置工具的行為。列印到標準錯誤控制流（`stderr`） 而不是標準輸出（`stdout`），例如這樣用戶可以選擇將成功輸出重定向到文件中的同時仍然在螢幕上顯示錯誤訊息。

一位 Rust 社區的成員，Andrew Gallant，已經創建了一個功能完整且非常快速的 `grep` 版本，叫做 `ripgrep`。相比之下，我們的 `grep` 版本將非常簡單，本章將教會你一些幫助理解像 `ripgrep` 這樣真實項目的背景知識。

我們的 `grep` 項目將會結合之前所學的一些內容：

- 代碼組織（使用 [第七章][ch7] 學習的模組）
- vector 和字串（[第八章][ch8]，集合）
- 錯誤處理（[第九章][ch9]）
- 合理的使用 trait 和生命週期（[第十章][ch10]）
- 測試（[第十一章][ch11]）

另外還會簡要的講到閉包、疊代器和 trait 對象，他們分別會在 [第十三章][ch13] 和 [第十七章][ch17] 中詳細介紹。

[ch7]: ch07-00-managing-growing-projects-with-packages-crates-and-modules.html
[ch8]: ch08-00-common-collections.html
[ch9]: ch09-00-error-handling.html
[ch10]: ch10-00-generics.html
[ch11]: ch11-00-testing.html
[ch13]: ch13-00-functional-features.html
[ch17]: ch17-00-oop.html

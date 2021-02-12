# 編寫自動化測試

> [ch11-00-testing.md](https://github.com/rust-lang/book/blob/master/src/ch11-00-testing.md)
> <br>
> commit 1fedfc4b96c2017f64ecfcf41a0a07e2e815f24f

Edsger W. Dijkstra 在其 1972 年的文章【謙卑的程式設計師】（“The Humble Programmer”）中說到 “軟體測試是證明 bug 存在的有效方法，而證明其不存在時則顯得令人絕望的不足。”（“Program testing can be a very effective way to show the presence of bugs, but it is hopelessly inadequate for showing their absence.”）這並不意味著我們不該儘可能地測試軟體！

程序的正確性意味著代碼如我們期望的那樣運行。Rust 是一個相當注重正確性的程式語言，不過正確性是一個難以證明的複雜主題。Rust 的類型系統在此問題上下了很大的功夫，不過它不可能捕獲所有種類的錯誤。為此，Rust 也在語言本身包含了編寫軟體測試的支持。

例如，我們可以編寫一個叫做 `add_two` 的將傳遞給它的值加二的函數。它的簽名有一個整型參數並返回一個整型值。當實現和編譯這個函數時，Rust 會進行所有目前我們已經見過的類型檢查和借用檢查，例如，這些檢查會確保我們不會傳遞 `String` 或無效的引用給這個函數。Rust 所 **不能** 檢查的是這個函數是否會準確的完成我們期望的工作：返回參數加二後的值，而不是比如說參數加 10 或減 50 的值！這也就是測試出場的地方。

我們可以編寫測試斷言，比如說，當傳遞 `3` 給 `add_two` 函數時，返回值是 `5`。無論何時對代碼進行修改，都可以運行測試來確保任何現存的正確行為沒有被改變。

測試是一項複雜的技能：雖然不能在一個章節的篇幅中介紹如何編寫好的測試的每個細節，但我們還是會討論 Rust 測試功能的機制。我們會講到編寫測試時會用到的註解和宏，運行測試的默認行為和選項，以及如何將測試組織成單元測試和集成測試。

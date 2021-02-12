# 最後的項目: 構建多執行緒 web server

> [ch20-00-final-project-a-web-server.md](https://github.com/rust-lang/book/blob/master/src/ch20-00-final-project-a-web-server.md)
> <br>
> commit c084bdd9ee328e7e774df19882ccc139532e53d8

這是一次漫長的旅途，不過我們到達了本書的結束。在本章中，我們將一同構建另一個項目，來展示最後幾章所學，同時複習更早的章節。

作為最後的項目，我們將要實現一個返回 “hello” 的 web server，它在瀏覽器中看起來就如圖例 20-1 所示：

![hello from rust](img/trpl20-01.png)

<span class="caption">圖例 20-1: 我們最後將一起分享的項目</span>

如下是我們將怎樣構建此 web server 的計劃：

1. 學習一些 TCP 與 HTTP 知識
2. 在套接字（socket）上監聽 TCP 請求
3. 解析少量的 HTTP 請求
4. 創建一個合適的 HTTP 響應
5. 通過執行緒池改善 server 的吞吐量

不過在開始之前，需要提到一點細節：這裡使用的方法並不是使用 Rust 構建 web server 最好的方法。[crates.io](https://crates.io/) 上有很多可用於生產環境的 crate，它們提供了比我們所要編寫的更為完整的 web server 和執行緒池實現。

然而，本章的目的在於學習，而不是走捷徑。因為 Rust 是一個系統程式語言，我們能夠選擇處理什麼層次的抽象，並能夠選擇比其他語言可能或可用的層次更低的層次。因此我們將自己編寫一個基礎的 HTTP server 和執行緒池，以便學習將來可能用到的 crate 背後的通用理念和技術。

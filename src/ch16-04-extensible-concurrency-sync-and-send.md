## 使用 `Sync` 和 `Send` trait 的可擴展並發

> [ch16-04-extensible-concurrency-sync-and-send.md](https://github.com/rust-lang/book/blob/master/src/ch16-04-extensible-concurrency-sync-and-send.md) <br>
> commit 426f3e4ec17e539ae9905ba559411169d303a031

Rust 的並發模型中一個有趣的方面是：語言本身對並發知之 **甚少**。我們之前討論的幾乎所有內容，都屬於標準庫，而不是語言本身的內容。由於不需要語言提供並發相關的基礎設施，並發方案不受標準庫或語言所限：我們可以編寫自己的或使用別人編寫的並發功能。

然而有兩個並發概念是內嵌於語言中的：`std::marker` 中的 `Sync` 和 `Send` trait。

### 通過 `Send` 允許在執行緒間轉移所有權

`Send` 標記 trait 表明類型的所有權可以在執行緒間傳遞。幾乎所有的 Rust 類型都是`Send` 的，不過有一些例外，包括 `Rc<T>`：這是不能 `Send` 的，因為如果複製了 `Rc<T>` 的值並嘗試將複製的所有權轉移到另一個執行緒，這兩個執行緒都可能同時更新引用計數。為此，`Rc<T>` 被實現為用於單執行緒場景，這時不需要為擁有執行緒安全的引用計數而付出性能代價。

因此，Rust 類型系統和 trait bound 確保永遠也不會意外的將不安全的 `Rc<T>` 在執行緒間發送。當嘗試在範例 16-14 中這麼做的時候，會得到錯誤 `the trait Send is not implemented for Rc<Mutex<i32>>`。而使用標記為 `Send` 的 `Arc<T>` 時，就沒有問題了。

任何完全由 `Send` 的類型組成的類型也會自動被標記為 `Send`。幾乎所有基本類型都是 `Send` 的，除了第十九章將會討論的裸指針（raw pointer）。

### `Sync` 允許多執行緒訪問

`Sync` 標記 trait 表明一個實現了 `Sync` 的類型可以安全的在多個執行緒中擁有其值的引用。換一種方式來說，對於任意類型 `T`，如果 `&T`（`T` 的引用）是 `Send` 的話 `T` 就是 `Sync` 的，這意味著其引用就可以安全的發送到另一個執行緒。類似於 `Send` 的情況，基本類型是 `Sync` 的，完全由 `Sync` 的類型組成的類型也是 `Sync` 的。

智慧指針 `Rc<T>` 也不是 `Sync` 的，出於其不是 `Send` 相同的原因。`RefCell<T>`（第十五章討論過）和 `Cell<T>` 系列類型不是 `Sync` 的。`RefCell<T>` 在運行時所進行的借用檢查也不是執行緒安全的。`Mutex<T>` 是 `Sync` 的，正如 [“在執行緒間共享 `Mutex<T>`”][sharing-a-mutext-between-multiple-threads] 部分所講的它可以被用來在多執行緒中共享訪問。

### 手動實現 `Send` 和 `Sync` 是不安全的

通常並不需要手動實現 `Send` 和 `Sync` trait，因為由 `Send` 和 `Sync` 的類型組成的類型，自動就是 `Send` 和 `Sync` 的。因為他們是標記 trait，甚至都不需要實現任何方法。他們只是用來加強並發相關的不可變性的。

手動實現這些標記 trait 涉及到編寫不安全的 Rust 代碼，第十九章將會講述具體的方法；當前重要的是，在創建新的由不是 `Send` 和 `Sync` 的部分構成的並發類型時需要多加小心，以確保維持其安全保證。[The Rustonomicon] 中有更多關於這些保證以及如何維持他們的訊息。

[the rustonomicon]: https://doc.rust-lang.org/stable/nomicon/

## 總結

這不會是本書最後一個出現並發的章節：第二十章的項目會在更現實的場景中使用這些概念，而不像本章中討論的這些小例子。

正如之前提到的，因為 Rust 本身很少有處理並發的部分內容，有很多的並發方案都由 crate 實現。他們比標準庫要發展的更快；請在網路上搜索當前最新的用於多執行緒場景的 crate。

Rust 提供了用於消息傳遞的通道，和像 `Mutex<T>` 和 `Arc<T>` 這樣可以安全的用於並發上下文的智慧指針。類型系統和借用檢查器會確保這些場景中的代碼，不會出現數據競爭和無效的引用。一旦代碼可以編譯了，我們就可以堅信這些程式碼可以正確的運行於多執行緒環境，而不會出現其他語言中經常出現的那些難以追蹤的 bug。並發編程不再是什麼可怕的概念：無所畏懼地並發吧！

接下來，讓我們討論一下當 Rust 程序變得更大時，有哪些符合語言習慣的問題建模方法和結構化解決方案，以及 Rust 的風格是如何與面向對象編程（Object Oriented Programming）中那些你所熟悉的概念相聯繫的。

[sharing-a-mutext-between-multiple-threads]: ch16-03-shared-state.html#sharing-a-mutext-between-multiple-threads

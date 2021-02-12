## `panic!` 與不可恢復的錯誤

> [ch09-01-unrecoverable-errors-with-panic.md](https://github.com/rust-lang/book/blob/master/src/ch09-01-unrecoverable-errors-with-panic.md)
> <br>
> commit 426f3e4ec17e539ae9905ba559411169d303a031

突然有一天，代碼出問題了，而你對此束手無策。對於這種情況，Rust 有 `panic!`宏。當執行這個宏時，程序會列印出一個錯誤訊息，展開並清理棧數據，然後接著退出。出現這種情況的場景通常是檢測到一些類型的 bug，而且程式設計師並不清楚該如何處理它。

> ### 對應 panic 時的棧展開或終止
>
> 當出現 panic 時，程式預設會開始 **展開**（*unwinding*），這意味著 Rust 會回溯棧並清理它遇到的每一個函數的數據，不過這個回溯並清理的過程有很多工作。另一種選擇是直接 **終止**（*abort*），這會不清理數據就退出程序。那麼程序所使用的記憶體需要由操作系統來清理。如果你需要項目的最終二進位制文件越小越好，panic 時通過在  *Cargo.toml* 的 `[profile]` 部分增加 `panic = 'abort'`，可以由展開切換為終止。例如，如果你想要在release模式中 panic 時直接終止：
>
> ```toml
> [profile.release]
> panic = 'abort'
> ```

讓我們在一個簡單的程序中調用 `panic!`：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic,panics
fn main() {
    panic!("crash and burn");
}
```

運行程序將會出現類似這樣的輸出：

```text
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/panic`
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

最後兩行包含 `panic!` 調用造成的錯誤訊息。第一行顯示了 panic 提供的訊息並指明了原始碼中 panic 出現的位置：*src/main.rs:2:5* 表明這是 *src/main.rs* 文件的第二行第五個字元。

在這個例子中，被指明的那一行是我們代碼的一部分，而且查看這一行的話就會發現 `panic!` 宏的調用。在其他情況下，`panic!` 可能會出現在我們的代碼所調用的代碼中。錯誤訊息報告的檔案名和行號可能指向別人代碼中的 `panic!` 宏調用，而不是我們代碼中最終導致 `panic!` 的那一行。我們可以使用 `panic!` 被調用的函數的 backtrace 來尋找代碼中出問題的地方。下面我們會詳細介紹 backtrace 是什麼。

### 使用 `panic!` 的 backtrace

讓我們來看看另一個因為我們代碼中的 bug 引起的別的庫中 `panic!` 的例子，而不是直接的宏調用。範例 9-1 有一些嘗試通過索引訪問 vector 中元素的例子：

<span class="filename">檔案名: src/main.rs</span>

```rust,should_panic,panics
fn main() {
    let v = vec![1, 2, 3];

    v[99];
}
```

<span class="caption">範例 9-1：嘗試訪問超越 vector 結尾的元素，這會造成 `panic!`</span>

這裡嘗試訪問 vector 的第一百個元素（這裡的索引是 99 因為索引從 0 開始），不過它只有三個元素。這種情況下 Rust 會 panic。`[]` 應當返回一個元素，不過如果傳遞了一個無效索引，就沒有可供 Rust 返回的正確的元素。

這種情況下其他像 C 這樣語言會嘗試直接提供所要求的值，即便這可能不是你期望的：你會得到任何對應 vector 中這個元素的記憶體位置的值，甚至是這些記憶體並不屬於 vector 的情況。這被稱為 **緩衝區溢出**（*buffer overread*），並可能會導致安全漏洞，比如攻擊者可以像這樣操作索引來讀取儲存在數組後面不被允許的數據。

為了使程序遠離這類漏洞，如果嘗試讀取一個索引不存在的元素，Rust 會停止執行並拒絕繼續。嘗試運行上面的程序會出現如下：

```text
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/panic`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', libcore/slice/mod.rs:2448:10
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

這指向了一個不是我們編寫的文件，*libcore/slice/mod.rs*。其為 Rust 原始碼中 `slice` 的實現。這是當對 vector `v` 使用 `[]` 時 *libcore/slice/mod.rs* 中會執行的代碼，也是真正出現 `panic!` 的地方。

接下來的幾行提醒我們可以設置 `RUST_BACKTRACE` 環境變數來得到一個 backtrace。*backtrace* 是一個執行到目前位置所有被調用的函數的列表。Rust 的 backtrace 跟其他語言中的一樣：閱讀 backtrace 的關鍵是從頭開始讀直到發現你編寫的文件。這就是問題的發源地。這一行往上是你的代碼所調用的代碼；往下則是調用你的代碼的代碼。這些行可能包含核心 Rust 代碼，標準庫代碼或用到的 crate 代碼。讓我們將 `RUST_BACKTRACE` 環境變數設置為任何不是 0 的值來獲取 backtrace 看看。範例 9-2 展示了與你看到類似的輸出：

```text
$ RUST_BACKTRACE=1 cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/panic`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', libcore/slice/mod.rs:2448:10
stack backtrace:
   0: std::sys::unix::backtrace::tracing::imp::unwind_backtrace
             at libstd/sys/unix/backtrace/tracing/gcc_s.rs:49
   1: std::sys_common::backtrace::print
             at libstd/sys_common/backtrace.rs:71
             at libstd/sys_common/backtrace.rs:59
   2: std::panicking::default_hook::{{closure}}
             at libstd/panicking.rs:211
   3: std::panicking::default_hook
             at libstd/panicking.rs:227
   4: <std::panicking::begin_panic::PanicPayload<A> as core::panic::BoxMeUp>::get
             at libstd/panicking.rs:476
   5: std::panicking::continue_panic_fmt
             at libstd/panicking.rs:390
   6: std::panicking::try::do_call
             at libstd/panicking.rs:325
   7: core::ptr::drop_in_place
             at libcore/panicking.rs:77
   8: core::ptr::drop_in_place
             at libcore/panicking.rs:59
   9: <usize as core::slice::SliceIndex<[T]>>::index
             at libcore/slice/mod.rs:2448
  10: core::slice::<impl core::ops::index::Index<I> for [T]>::index
             at libcore/slice/mod.rs:2316
  11: <alloc::vec::Vec<T> as core::ops::index::Index<I>>::index
             at liballoc/vec.rs:1653
  12: panic::main
             at src/main.rs:4
  13: std::rt::lang_start::{{closure}}
             at libstd/rt.rs:74
  14: std::panicking::try::do_call
             at libstd/rt.rs:59
             at libstd/panicking.rs:310
  15: macho_symbol_search
             at libpanic_unwind/lib.rs:102
  16: std::alloc::default_alloc_error_hook
             at libstd/panicking.rs:289
             at libstd/panic.rs:392
             at libstd/rt.rs:58
  17: std::rt::lang_start
             at libstd/rt.rs:74
  18: panic::main
```

<span class="caption">範例 9-2：當設置 `RUST_BACKTRACE` 環境變數時 `panic!` 調用所生成的 backtrace 訊息</span>

這裡有大量的輸出！你實際看到的輸出可能因不同的操作系統和 Rust 版本而有所不同。為了獲取帶有這些訊息的 backtrace，必須啟用 debug 標識。當不使用 `--release` 參數運行 cargo build 或 cargo run 時 debug 標識會預設啟用，就像這裡一樣。

範例 9-2 的輸出中，backtrace 的 12 行指向了我們項目中造成問題的行：*src/main.rs* 的第 4 行。如果你不希望程序 panic，第一個提到我們編寫的代碼行的位置是你應該開始調查的，以便查明是什麼值如何在這個地方引起了 panic。在範例 9-1 中，我們故意編寫會 panic 的代碼來示範如何使用 backtrace，修復這個 panic 的方法就是不要嘗試在一個只包含三個項的 vector 中請求索引是 100 的元素。當將來你的代碼出現了 panic，你需要搞清楚在這特定的場景下代碼中執行了什麼操作和什麼值導致了 panic，以及應當如何處理才能避免這個問題。

本章後面的小節 [“panic! 還是不 panic!”][to-panic-or-not-to-panic] 會再次回到 `panic!` 並講解何時應該、何時不應該使用 `panic!` 來處理錯誤情況。接下來，我們來看看如何使用 `Result` 來從錯誤中恢復。

[to-panic-or-not-to-panic]:
ch09-03-to-panic-or-not-to-panic.html#to-panic-or-not-to-panic

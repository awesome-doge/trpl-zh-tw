## 附錄 G：Rust 是如何開發的與 “Nightly Rust”

> [appendix-07-nightly-rust.md](https://github.com/rust-lang/book/blob/master/src/appendix-07-nightly-rust.md)
> <br />
> commit 70a82519e48b8a61f98cabb8ff443d1b21962fea

本附錄介紹 Rust 是如何開發的以及這如何影響作為 Rust 開發者的你。

### 無停滯穩定

作為一個語言，Rust **十分** 注重代碼的穩定性。我們希望 Rust 成為你代碼堅實的基礎，假如持續地有東西在變，這個希望就實現不了。但與此同時，如果不能實驗新功能的話，在發布之前我們又無法發現其中重大的缺陷，而一旦發布便再也沒有修改的機會了。

對於這個問題我們的解決方案被稱為 “無停滯穩定”（“stability without stagnation”），其指導性原則是：無需擔心升級到最新的穩定版 Rust。每次升級應該是無痛的，並應帶來新功能，更少的 bug 和更快的編譯速度。

### Choo, Choo! ~~（開車啦，逃）~~ 發布通道和發布時刻表（Riding the Trains）

Rust 開發運行於一個 ~~車次表~~ **發布時刻表**（*train schedule*）之上。也就是說，所有的開發工作都位於 Rust 倉庫的 `master` 分支。發布採用 software release train 模型，其被用於思科 IOS 等其它軟體項目。Rust 有三個 **發布通道**（*release channel*）：

* Nightly
* Beta
* Stable（穩定版）

大部分 Rust 開發者主要採用穩定版通道，不過希望實驗新功能的開發者可能會使用 nightly 或 beta 版。

如下是一個開發和發布過程如何運轉的例子：假設 Rust 團隊正在進行 Rust 1.5 的發布工作。該版本發布於 2015 年 12 月，不過這裡只是為了提供一個真實的版本。Rust 新增了一項功能：一個 `master` 分支的新提交。每天晚上，會產生一個新的 nightly 版本。每天都是發布版本的日子，而這些發布由發布基礎設施自動完成。所以隨著時間推移，發布軌跡看起來像這樣，版本一天一發：

```text
nightly: * - - * - - *
```

每 6 周時間，是準備發布新版本的時候了！Rust 倉庫的 `beta` 分支會從用於 nightly 的 `master` 分支產生。現在，有了兩個發布版本：

```text
nightly: * - - * - - *
                     |
beta:                *
```

大部分 Rust 用戶不會主要使用 beta 版本，不過在 CI 系統中對 beta 版本進行測試能夠幫助 Rust 發現可能的回歸缺陷（regression）。同時，每天仍產生 nightly 發布：

```text
nightly: * - - * - - * - - * - - *
                     |
beta:                *
```

比如我們發現了一個回歸缺陷。好消息是在這些缺陷流入穩定發布之前還有一些時間來測試 beta 版本！fix 被合併到 `master`，為此 nightly 版本得到了修復，接著這些 fix 將 backport 到 `beta` 分支，一個新的 beta 發布就產生了：

```text
nightly: * - - * - - * - - * - - * - - *
                     |
beta:                * - - - - - - - - *
```

第一個 beta 版的 6 周後，是發布穩定版的時候了！`stable` 分支從 `beta` 分支生成：

```text
nightly: * - - * - - * - - * - - * - - * - * - *
                     |
beta:                * - - - - - - - - *
                                       |
stable:                                *
```

好的！Rust 1.5 發布了！然而，我們忘了些東西：因為又過了 6 周，我們還需發布 **新版** Rust 的 beta 版，Rust 1.6。所以從 `beta` 生成 `stable` 分支後，新版的 `beta` 分支也再次從 `nightly` 生成：

```text
nightly: * - - * - - * - - * - - * - - * - * - *
                     |                         |
beta:                * - - - - - - - - *       *
                                       |
stable:                                *
```

這被稱為 “train model”，因為每 6 周，一個版本 “離開車站”（“leaves the station”），不過從 beta 通道到達穩定通道還有一段旅程。

Rust 每 6 周發布一個版本，如時鐘般準確。如果你知道了某個 Rust 版本的發布時間，就可以知道下個版本的時間：6 周後。每 6 周發布版本的一個好的方面是下一班車會來得更快。如果特定版本碰巧缺失某個功能也無需擔心：另一個版本很快就會到來！這有助於減少因臨近發版時間而偷偷釋出未經完善的功能的壓力。

多虧了這個過程，你總是可以切換到下一版本的 Rust 並驗證是否可以輕易的升級：如果 beta 版不能如期工作，你可以向 Rust 團隊報告並在發布穩定版之前得到修復！beta 版造成的破壞是非常少見的，不過 `rustc` 也不過是一個軟體，可能會存在 bug。

### 不穩定功能

這個發布模型中另一個值得注意的地方：不穩定功能（unstable features）。Rust 使用一個被稱為 “功能標記”（“feature flags”）的技術來確定給定版本的某個功能是否啟用。如果新功能正在積極地開發中，其提交到了 `master`，因此會出現在 nightly 版中，不過會位於一個 **功能標記** 之後。作為用戶，如果你希望嘗試這個正在開發的功能，則可以在原始碼中使用合適的標記來開啟，不過必須使用 nightly 版。

如果使用的是 beta 或穩定版 Rust，則不能使用任何功能標記。這是在新功能被宣布為永久穩定之前獲得實用價值的關鍵。這既滿足了希望使用最尖端技術的同學，那些堅持穩定版的同學也知道其代碼不會被破壞。這就是無停滯穩定。

本書只包含穩定的功能，因為還在開發中的功能仍可能改變，當其進入穩定版時肯定會與編寫本書的時候有所不同。你可以在網路上獲取 nightly 版的文件。

### Rustup 和 Rust Nightly 的職責

Rustup 使得改變不同發布通道的 Rust 更為簡單，其在全局或分項目的層次工作。其預設會安裝穩定版 Rust。例如為了安裝 nightly：

```text
$ rustup install nightly
```

你會發現 `rustup` 也安裝了所有的 **工具鏈**（*toolchains*， Rust 和其相關組件）。如下是一位作者的 Windows 計算機上的例子：

```powershell
> rustup toolchain list
stable-x86_64-pc-windows-msvc (default)
beta-x86_64-pc-windows-msvc
nightly-x86_64-pc-windows-msvc
```

如你所見，預設是穩定版。大部分 Rust 用戶在大部分時間使用穩定版。你可能也會這麼做，不過如果你關心最新的功能，可以為特定項目使用 nightly 版。為此，可以在項目目錄使用 `rustup override` 來設置當前目錄 `rustup` 使用 nightly 工具鏈：

```text
$ cd ~/projects/needs-nightly
$ rustup override set nightly
```

現在，每次在 *~/projects/needs-nightly* 調用 `rustc` 或 `cargo`，`rustup` 會確保使用 nightly 版 Rust。在你有很多 Rust 項目時大有裨益！

### RFC 過程和團隊

那麼你如何了解這些新功能呢？Rust 開發模式遵循一個 **Request For Comments (RFC) 過程**。如果你希望改進 Rust，可以編寫一個提議，也就是 RFC。

任何人都可以編寫 RFC 來改進 Rust，同時這些 RFC 會被 Rust 團隊評審和討論，他們由很多不同分工的子團隊組成。這裡是 [Rust 官網上](https://www.rust-lang.org/governance) 所有團隊的總列表，其包含了項目中每個領域的團隊：語言設計、編譯器實現、基礎設施、文件等。各個團隊會閱讀相應的提議和評論，編寫回復，並最終達成接受或回絕功能的一致。

如果功能被接受了，在 Rust 倉庫會打開一個 issue，人們就可以實現它。實現功能的人當然可能不是最初提議功能的人！當實現完成後，其會合併到 `master` 分支並位於一個功能開關（feature gate）之後，正如 [“不穩定功能”](#unstable-features) 部分所討論的。

在稍後的某個時間，一旦使用 nightly 版的 Rust 團隊能夠嘗試這個功能了，團隊成員會討論這個功能，它如何在 nightly 中工作，並決定是否應該進入穩定版。如果決定繼續推進，功能開關會移除，然後這個功能就被認為是穩定的了！乘著“發布的列車”，最終在新的穩定版 Rust 中出現。

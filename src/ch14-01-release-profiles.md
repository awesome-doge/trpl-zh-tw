## 採用發布配置自訂構建

> [ch14-01-release-profiles.md](https://github.com/rust-lang/book/blob/master/src/ch14-01-release-profiles.md)
> <br>
> commit 0f10093ac5fbd57feb2352e08ee6d3efd66f887c

在 Rust 中 **發布配置**（*release profiles*）是預定義的、可訂製的帶有不同選項的配置，他們允許程式設計師更靈活地控制代碼編譯的多種選項。每一個配置都彼此相互獨立。

Cargo 有兩個主要的配置：運行 `cargo build` 時採用的 `dev` 配置和運行 `cargo build --release` 的 `release` 配置。`dev` 配置被定義為開發時的好的默認配置，`release` 配置則有著良好的發布構建的默認配置。

這些配置名稱可能很眼熟，因為它們出現在構建的輸出中：

```text
$ cargo build
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
$ cargo build --release
    Finished release [optimized] target(s) in 0.0 secs
```

構建輸出中的 `dev` 和 `release` 表明編譯器在使用不同的配置。

當項目的 *Cargo.toml* 文件中沒有任何 `[profile.*]` 部分的時候，Cargo 會對每一個配置都採用默認設置。透過增加任何希望訂製的配置對應的 `[profile.*]` 部分，我們可以選擇覆蓋任意默認設置的子集。例如，如下是 `dev` 和 `release` 配置的 `opt-level` 設置的預設值：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```

`opt-level` 設置控制 Rust 會對代碼進行何種程度的最佳化。這個配置的值從 0 到 3。越高的最佳化級別需要更多的時間編譯，所以如果你在進行開發並經常編譯，可能會希望在犧牲一些程式碼性能的情況下編譯得快一些。這就是為什麼 `dev` 的 `opt-level` 預設為 `0`。當你準備發布時，花費更多時間在編譯上則更好。只需要在發布模式編譯一次，而編譯出來的程序則會運行很多次，所以發布模式用更長的編譯時間換取運行更快的代碼。這正是為什麼 `release` 配置的 `opt-level` 預設為 `3`。

我們可以選擇通過在 *Cargo.toml* 增加不同的值來覆蓋任何默認設置。比如，如果我們想要在開發配置中使用級別 1 的最佳化，則可以在 *Cargo.toml* 中增加這兩行：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[profile.dev]
opt-level = 1
```

這會覆蓋預設的設置 `0`。現在運行 `cargo build` 時，Cargo 將會使用 `dev` 的默認配置加上訂製的 `opt-level`。因為 `opt-level` 設置為 `1`，Cargo 會比默認進行更多的最佳化，但是沒有發布構建那麼多。

對於每個配置的設置和其預設值的完整列表，請查看 [Cargo 的文件](https://doc.rust-lang.org/cargo/reference/manifest.html#the-profile-sections)。

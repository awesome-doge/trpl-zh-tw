## 使用 `use` 關鍵字將名稱引入作用域

> [ch07-04-bringing-paths-into-scope-with-the-use-keyword.md](https://github.com/rust-lang/book/blob/master/src/ch07-04-bringing-paths-into-scope-with-the-use-keyword.md)
> <br>
> commit 6d3e76820418f2d2bb203233c61d90390b5690f1

到目前為止，似乎我們編寫的用於調用函數的路徑都很冗長且重複，並不方便。例如，範例 7-7 中，無論我們選擇 `add_to_waitlist` 函數的絕對路徑還是相對路徑，每次我們想要調用 `add_to_waitlist` 時，都必須指定`front_of_house` 和 `hosting`。幸運的是，有一種方法可以簡化這個過程。我們可以使用 `use` 關鍵字將路徑一次性引入作用域，然後調用該路徑中的項，就如同它們是本地項一樣。

在範例 7-11 中，我們將 `crate::front_of_house::hosting` 模組引入了 `eat_at_restaurant` 函數的作用域，而我們只需要指定 `hosting::add_to_waitlist` 即可在 `eat_at_restaurant` 中調用 `add_to_waitlist` 函數。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
# fn main() {}
```

<span class="caption">範例 7-11: 使用 `use` 將模組引入作用域</span>

在作用域中增加 `use` 和路徑類似於在文件系統中創建軟連接（符號連接，symbolic link）。通過在 crate 根增加 `use crate::front_of_house::hosting`，現在 `hosting` 在作用域中就是有效的名稱了，如同 `hosting` 模組被定義於 crate 根一樣。通過 `use` 引入作用域的路徑也會檢查私有性，同其它路徑一樣。

你還可以使用 `use` 和相對路徑來將一個項引入作用域。範例 7-12 展示了如何指定相對路徑來取得與範例 7-11 中一樣的行為。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
# fn main() {}
```

<span class="caption">範例 7-12: 使用 `use` 和相對路徑將模組引入作用域</span>

### 創建慣用的 `use` 路徑

在範例 7-11 中，你可能會比較疑惑，為什麼我們是指定 `use crate::front_of_house::hosting` ，然後在 `eat_at_restaurant` 中調用 `hosting::add_to_waitlist` ，而不是通過指定一直到 `add_to_waitlist` 函數的 `use` 路徑來得到相同的結果，如範例 7-13 所示。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    add_to_waitlist();
    add_to_waitlist();
    add_to_waitlist();
}
# fn main() {}
```

<span class="caption">範例 7-13: 使用 `use` 將 `add_to_waitlist` 函數引入作用域，這並不符合習慣</span>

雖然範例 7-11 和 7-13 都完成了相同的任務，但範例 7-11 是使用 `use` 將函數引入作用域的習慣用法。要想使用 `use` 將函數的父模組引入作用域，我們必須在調用函數時指定父模組，這樣可以清晰地表明函數不是在本地定義的，同時使完整路徑的重複度最小化。範例 7-13 中的代碼不清楚 `add_to_waitlist` 是在哪裡被定義的。

另一方面，使用 `use` 引入結構體、枚舉和其他項時，習慣是指定它們的完整路徑。範例 7-14 展示了將 `HashMap` 結構體引入二進位制 crate 作用域的習慣用法。

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

<span class="caption">範例 7-14: 將 `HashMap` 引入作用域的習慣用法</span>

這種習慣用法背後沒有什麼硬性要求：它只是一種慣例，人們已經習慣了以這種方式閱讀和編寫 Rust 代碼。

這個習慣用法有一個例外，那就是我們想使用 `use` 語句將兩個具有相同名稱的項帶入作用域，因為 Rust 不允許這樣做。範例 7-15 展示了如何將兩個具有相同名稱但不同父模組的 `Result` 類型引入作用域，以及如何引用它們。

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // --snip--
#     Ok(())
}

fn function2() -> io::Result<()> {
    // --snip--
#     Ok(())
}
```

<span class="caption">範例 7-15: 使用父模組將兩個具有相同名稱的類型引入同一作用域</span>

如你所見，使用父模組可以區分這兩個 `Result` 類型。如果我們是指定 `use std::fmt::Result` 和 `use std::io::Result`，我們將在同一作用域擁有了兩個 `Result` 類型，當我們使用 `Result` 時，Rust 則不知道我們要用的是哪個。

### 使用 `as` 關鍵字提供新的名稱

使用 `use` 將兩個同名類型引入同一作用域這個問題還有另一個解決辦法：在這個類型的路徑後面，我們使用 `as` 指定一個新的本地名稱或者別名。範例 7-16 展示了另一個編寫範例 7-15 中代碼的方法，通過 `as` 重命名其中一個 `Result` 類型。

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    // --snip--
#     Ok(())
}

fn function2() -> IoResult<()> {
    // --snip--
#     Ok(())
}
```

<span class="caption">範例 7-16: 使用 `as` 關鍵字重命名引入作用域的類型</span>

在第二個 `use` 語句中，我們選擇 `IoResult` 作為 `std::io::Result` 的新名稱，它與從 `std::fmt` 引入作用域的 `Result` 並不衝突。範例 7-15 和範例 7-16 都是慣用的，如何選擇都取決於你!

### 使用 `pub use` 重導出名稱

當使用 `use` 關鍵字將名稱導入作用域時，在新作用域中可用的名稱是私有的。如果為了讓調用你編寫的代碼的代碼能夠像在自己的作用域內引用這些類型，可以結合 `pub` 和 `use`。這個技術被稱為 “*重導出*（*re-exporting*）”，因為這樣做將項引入作用域並同時使其可供其他代碼引入自己的作用域。

範例 7-17 展示了將範例 7-11 中使用 `use` 的根模組變為 `pub use` 的版本的代碼。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
# fn main() {}
```

<span class="caption">範例 7-17: 通過 `pub use` 使名稱可引入任何代碼的作用域中</span>

通過 `pub use`，現在可以通過新路徑 `hosting::add_to_waitlist` 來調用 `add_to_waitlist` 函數。如果沒有指定 `pub use`，`eat_at_restaurant` 函數可以在其作用域中調用 `hosting::add_to_waitlist`，但外部代碼則不允許使用這個新路徑。

當你的代碼的內部結構與調用你的代碼的程式設計師的思考領域不同時，重導出會很有用。例如，在這個餐館的比喻中，經營餐館的人會想到“前台”和“後台”。但顧客在光顧一家餐館時，可能不會以這些術語來考慮餐館的各個部分。使用 `pub use`，我們可以使用一種結構編寫程式碼，卻將不同的結構形式暴露出來。這樣做使我們的庫井井有條，方便開發這個庫的程式設計師和調用這個庫的程式設計師之間組織起來。

### 使用外部包

在第二章中我們編寫了一個猜猜看遊戲。那個項目使用了一個外部包，`rand`，來生成隨機數。為了在項目中使用 `rand`，在 *Cargo.toml* 中加入了如下行：

<span class="filename">檔案名: Cargo.toml</span>

```toml
[dependencies]
rand = "0.5.5"
```

在 *Cargo.toml* 中加入 `rand` 依賴告訴了 Cargo 要從 [crates.io](https://crates.io) 下載 `rand` 和其依賴，並使其可在項目代碼中使用。

接著，為了將 `rand` 定義引入項目包的作用域，我們加入一行 `use` 起始的包名，它以 `rand` 包名開頭並列出了需要引入作用域的項。回憶一下第二章的 “生成一個隨機數” 部分，我們曾將 `Rng` trait 引入作用域並調用了 `rand::thread_rng` 函數：

```rust,ignore
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1, 101);
}
```

[crates.io](https://crates.io) 上有很多 Rust 社區成員發布的包，將其引入你自己的項目都需要一道相同的步驟：在 *Cargo.toml* 列出它們並通過 `use` 將其中定義的項引入項目包的作用域中。

注意標準庫（`std`）對於你的包來說也是外部 crate。因為標準庫隨 Rust 語言一同分發，無需修改 *Cargo.toml* 來引入 `std`，不過需要通過 `use` 將標準庫中定義的項引入項目包的作用域中來引用它們，比如我們使用的 `HashMap`：

```rust
use std::collections::HashMap;
```

這是一個以標準庫 crate 名 `std` 開頭的絕對路徑。

### 嵌套路徑來消除大量的 `use` 行

當需要引入很多定義於相同包或相同模組的項時，為每一項單獨列出一行會占用原始碼很大的空間。例如猜猜看章節範例 2-4 中有兩行 `use` 語句都從 `std` 引入項到作用域：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::cmp::Ordering;
use std::io;
// ---snip---
```

相反，我們可以使用嵌套路徑將相同的項在一行中引入作用域。這麼做需要指定路徑的相同部分，接著是兩個冒號，接著是大括號中的各自不同的路徑部分，如範例 7-18 所示。

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::{cmp::Ordering, io};
// ---snip---
```

<span class="caption">範例 7-18: 指定嵌套的路徑在一行中將多個帶有相同前綴的項引入作用域</span>

在較大的程序中，使用嵌套路徑從相同包或模組中引入很多項，可以顯著減少所需的獨立 `use` 語句的數量！

我們可以在路徑的任何層級使用嵌套路徑，這在組合兩個共享子路徑的 `use` 語句時非常有用。例如，範例 7-19 中展示了兩個 `use` 語句：一個將 `std::io` 引入作用域，另一個將 `std::io::Write` 引入作用域：

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::io;
use std::io::Write;
```

<span class="caption">範例 7-19: 通過兩行 `use` 語句引入兩個路徑，其中一個是另一個的子路徑</span>

兩個路徑的相同部分是 `std::io`，這正是第一個路徑。為了在一行 `use` 語句中引入這兩個路徑，可以在嵌套路徑中使用 `self`，如範例 7-20 所示。

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::io::{self, Write};
```

<span class="caption">範例 7-20: 將範例 7-19 中部分重複的路徑合併為一個 `use` 語句</span>

這一行便將 `std::io` 和 `std::io::Write` 同時引入作用域。

### 通過 glob 運算符將所有的公有定義引入作用域

如果希望將一個路徑下 **所有** 公有項引入作用域，可以指定路徑後跟 `*`，glob 運算符：

```rust
use std::collections::*;
```

這個 `use` 語句將 `std::collections` 中定義的所有公有項引入當前作用域。使用 glob 運算符時請多加小心！Glob 會使得我們難以推導作用域中有什麼名稱和它們是在何處定義的。

glob 運算符經常用於測試模組 `tests` 中，這時會將所有內容引入作用域；我們將在第十一章 “如何編寫測試” 部分講解。glob 運算符有時也用於 prelude 模式；查看 [標準庫中的文件](https://doc.rust-lang.org/std/prelude/index.html#other-preludes) 了解這個模式的更多細節。

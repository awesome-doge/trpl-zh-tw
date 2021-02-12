## 路徑用於引用模組樹中的項

> [ch07-03-paths-for-referring-to-an-item-in-the-module-tree.md](https://github.com/rust-lang/book/blob/master/src/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.md)
> <br>
> commit cc6a1ef2614aa94003566027b285b249ccf961fa

來看一下 Rust 如何在模組樹中找到一個項的位置，我們使用路徑的方式，就像在文件系統使用路徑一樣。如果我們想要調用一個函數，我們需要知道它的路徑。

路徑有兩種形式：

* **絕對路徑**（*absolute path*）從 crate 根開始，以 crate 名或者字面值 `crate` 開頭。
* **相對路徑**（*relative path*）從當前模組開始，以 `self`、`super` 或當前模組的標識符開頭。

絕對路徑和相對路徑都後跟一個或多個由雙冒號（`::`）分割的標識符。

讓我們回到範例 7-1。我們如何調用 `add_to_waitlist` 函數？還是同樣的問題，`add_to_waitlist` 函數的路徑是什麼？在範例 7-3 中，我們通過刪除一些模組和函數，稍微簡化了一下我們的代碼。我們在 crate 根定義了一個新函數 `eat_at_restaurant`，並在其中展示調用 `add_to_waitlist` 函數的兩種方法。`eat_at_restaurant` 函數是我們 crate 庫的一個公共API，所以我們使用 `pub` 關鍵字來標記它。在 “[使用`pub`關鍵字暴露路徑](ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html#exposing-paths-with-the-pub-keyword)” 一節，我們將詳細介紹 `pub`。注意，這個例子無法編譯通過，我們稍後會解釋原因。

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
```

<span class="caption">範例 7-3: 使用絕對路徑和相對路徑來調用 `add_to_waitlist` 函數</span>

第一種方式，我們在 `eat_at_restaurant` 中調用 `add_to_waitlist` 函數，使用的是絕對路徑。`add_to_waitlist` 函數與 `eat_at_restaurant` 被定義在同一 crate 中，這意味著我們可以使用 `crate` 關鍵字為起始的絕對路徑。

在 `crate` 後面，我們持續地嵌入模組，直到我們找到 `add_to_waitlist`。你可以想像出一個相同結構的文件系統，我們通過指定路徑 `/front_of_house/hosting/add_to_waitlist` 來執行 `add_to_waitlist` 程序。我們使用 `crate` 從 crate 根開始就類似於在 shell 中使用 `/` 從文件系統根開始。

第二種方式，我們在 `eat_at_restaurant` 中調用 `add_to_waitlist`，使用的是相對路徑。這個路徑以 `front_of_house` 為起始，這個模組在模組樹中，與 `eat_at_restaurant` 定義在同一層級。與之等價的文件系統路徑就是 `front_of_house/hosting/add_to_waitlist`。以名稱為起始，意味著該路徑是相對路徑。

選擇使用相對路徑還是絕對路徑，還是要取決於你的項目。取決於你是更傾向於將項的定義代碼與使用該項的代碼分開來移動，還是一起移動。舉一個例子，如果我們要將 `front_of_house` 模組和 `eat_at_restaurant` 函數一起移動到一個名為 `customer_experience` 的模組中，我們需要更新 `add_to_waitlist` 的絕對路徑，但是相對路徑還是可用的。然而，如果我們要將 `eat_at_restaurant` 函數單獨移到一個名為 `dining` 的模組中，還是可以使用原本的絕對路徑來調用 `add_to_waitlist`，但是相對路徑必須要更新。我們更傾向於使用絕對路徑，因為把代碼定義和項調用各自獨立地移動是更常見的。

讓我們試著編譯一下範例 7-3，並查明為何不能編譯！範例 7-4 展示了這個錯誤。

```text
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: module `hosting` is private
 --> src/lib.rs:9:28
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                            ^^^^^^^

error[E0603]: module `hosting` is private
  --> src/lib.rs:12:21
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                     ^^^^^^^
```

<span class="caption">範例 7-4: 構建範例 7-3 出現的編譯器錯誤</span>

錯誤訊息說 `hosting` 模組是私有的。換句話說，我們擁有 `hosting` 模組和 `add_to_waitlist` 函數的的正確路徑，但是 Rust 不讓我們使用，因為它不能訪問私有片段。

模組不僅對於你組織代碼很有用。他們還定義了 Rust 的 *私有性邊界*（*privacy boundary*）：這條界線不允許外部代碼了解、調用和依賴被封裝的實現細節。所以，如果你希望創建一個私有函數或結構體，你可以將其放入模組。

Rust 中默認所有項（函數、方法、結構體、枚舉、模組和常量）都是私有的。父模組中的項不能使用子模組中的私有項，但是子模組中的項可以使用他們父模組中的項。這是因為子模組封裝並隱藏了他們的實現詳情，但是子模組可以看到他們定義的上下文。繼續拿餐館作比喻，把私有性規則想像成餐館的後台辦公室：餐館內的事務對餐廳顧客來說是不可知的，但辦公室經理可以洞悉其經營的餐廳並在其中做任何事情。

Rust 選擇以這種方式來實現模組系統功能，因此默認隱藏內部實現細節。這樣一來，你就知道可以更改內部代碼的哪些部分而不會破壞外部代碼。你還可以透過使用 `pub` 關鍵字來創建公共項，使子模組的內部部分暴露給上級模組。

### 使用 `pub` 關鍵字暴露路徑

讓我們回頭看一下範例 7-4 的錯誤，它告訴我們 `hosting` 模組是私有的。我們想讓父模組中的 `eat_at_restaurant` 函數可以訪問子模組中的 `add_to_waitlist` 函數，因此我們使用 `pub` 關鍵字來標記 `hosting` 模組，如範例 7-5 所示。

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
```

<span class="caption">範例 7-5: 使用 `pub` 關鍵字聲明 `hosting` 模組使其可在 `eat_at_restaurant` 使用</span>

不幸的是，範例 7-5 的代碼編譯仍然有錯誤，如範例 7-6 所示。

```text
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: function `add_to_waitlist` is private
 --> src/lib.rs:9:37
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                                     ^^^^^^^^^^^^^^^

error[E0603]: function `add_to_waitlist` is private
  --> src/lib.rs:12:30
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                              ^^^^^^^^^^^^^^^
```

<span class="caption">範例 7-6: 構建範例 7-5 出現的編譯器錯誤</span>

發生了什麼事？在 `mod hosting` 前添加了 `pub` 關鍵字，使其變成公有的。伴隨著這種變化，如果我們可以訪問 `front_of_house`，那我們也可以訪問 `hosting`。但是 `hosting` 的 *內容*（*contents*） 仍然是私有的；這表明使模組公有並不使其內容也是公有的。模組上的 `pub` 關鍵字只允許其父模組引用它。

範例 7-6 中的錯誤說，`add_to_waitlist` 函數是私有的。私有性規則不但應用於模組，還應用於結構體、枚舉、函數和方法。

讓我們繼續將 `pub` 關鍵字放置在 `add_to_waitlist` 函數的定義之前，使其變成公有。如範例 7-7 所示。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}
# fn main() {}
```

<span class="caption">範例 7-7: 為 `mod hosting`
和 `fn add_to_waitlist` 添加 `pub` 關鍵字使他們可以在
`eat_at_restaurant` 函數中被調用</span>

現在代碼可以編譯通過了！讓我們看看絕對路徑和相對路徑，並根據私有性規則，再檢查一下為什麼增加 `pub` 關鍵字使得我們可以在 `add_to_waitlist` 中調用這些路徑。

在絕對路徑，我們從 `crate`，也就是 crate 根開始。然後 crate 根中定義了 `front_of_house` 模組。`front_of_house` 模組不是公有的，不過因為 `eat_at_restaurant` 函數與 `front_of_house` 定義於同一模組中（即，`eat_at_restaurant` 和 `front_of_house` 是兄弟），我們可以從 `eat_at_restaurant` 中引用 `front_of_house`。接下來是使用 `pub` 標記的 `hosting` 模組。我們可以訪問 `hosting` 的父模組，所以可以訪問 `hosting`。最後，`add_to_waitlist` 函數被標記為 `pub` ，我們可以訪問其父模組，所以這個函數調用是有效的！

在相對路徑，其邏輯與絕對路徑相同，除了第一步：不同於從 crate 根開始，路徑從 `front_of_house` 開始。`front_of_house` 模組與 `eat_at_restaurant` 定義於同一模組，所以從 `eat_at_restaurant` 中開始定義的該模組相對路徑是有效的。接下來因為 `hosting` 和 `add_to_waitlist` 被標記為 `pub`，路徑其餘的部分也是有效的，因此函數調用也是有效的！

### 使用 `super` 起始的相對路徑

我們還可以使用 `super` 開頭來構建從父模組開始的相對路徑。這麼做類似於文件系統中以 `..` 開頭的語法。我們為什麼要這樣做呢？

考慮一下範例 7-8 中的代碼，它模擬了廚師更正了一個錯誤訂單，並親自將其提供給客戶的情況。`fix_incorrect_order` 函數通過指定的 `super` 起始的 `serve_order` 路徑，來調用 `serve_order` 函數：

<span class="filename">檔案名: src/lib.rs</span>

```rust
fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();
    }

    fn cook_order() {}
}
# fn main() {}
```

<span class="caption">範例 7-8: 使用以 `super` 開頭的相對路徑從父目錄開始調用函數</span>

`fix_incorrect_order` 函數在 `back_of_house` 模組中，所以我們可以使用 `super` 進入 `back_of_house` 父模組，也就是本例中的 `crate` 根。在這裡，我們可以找到 `serve_order`。成功！我們認為 `back_of_house` 模組和 `serve_order` 函數之間可能具有某種關聯關係，並且，如果我們要重新組織這個 crate 的模組樹，需要一起移動它們。因此，我們使用 `super`，這樣一來，如果這些程式碼被移動到了其他模組，我們只需要更新很少的代碼。

### 創建公有的結構體和枚舉

我們還可以使用 `pub` 來設計公有的結構體和枚舉，不過有一些額外的細節需要注意。如果我們在一個結構體定義的前面使用了 `pub` ，這個結構體會變成公有的，但是這個結構體的欄位仍然是私有的。我們可以根據情況決定每個欄位是否公有。在範例 7-9 中，我們定義了一個公有結構體 `back_of_house:Breakfast`，其中有一個公有欄位 `toast` 和私有欄位 `seasonal_fruit`。這個例子模擬的情況是，在一家餐館中，顧客可以選擇隨餐附贈的麵包類型，但是廚師會根據季節和庫存情況來決定隨餐搭配的水果。餐館可用的水果變化是很快的，所以顧客不能選擇水果，甚至無法看到他們將會得到什麼水果。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // Order a breakfast in the summer with Rye toast
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // Change our mind about what bread we'd like
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);

    // The next line won't compile if we uncomment it; we're not allowed
    // to see or modify the seasonal fruit that comes with the meal
    // meal.seasonal_fruit = String::from("blueberries");
}
```

<span class="caption">範例 7-9: 帶有公有和私有欄位的結構體</span>

因為 `back_of_house::Breakfast` 結構體的 `toast` 欄位是公有的，所以我們可以在 `eat_at_restaurant` 中使用點號來隨意的讀寫 `toast` 欄位。注意，我們不能在 `eat_at_restaurant` 中使用 `seasonal_fruit` 欄位，因為 `seasonal_fruit` 是私有的。嘗試去除那一行修改 `seasonal_fruit` 欄位值的代碼的注釋，看看你會得到什麼錯誤！

還請注意一點，因為 `back_of_house::Breakfast` 具有私有欄位，所以這個結構體需要提供一個公共的關聯函數來構造 `Breakfast` 的實例(這裡我們命名為 `summer`)。如果 `Breakfast` 沒有這樣的函數，我們將無法在 `eat_at_restaurant` 中創建 `Breakfast` 實例，因為我們不能在 `eat_at_restaurant` 中設置私有欄位 `seasonal_fruit` 的值。

與之相反，如果我們將枚舉設為公有，則它的所有成員都將變為公有。我們只需要在 `enum` 關鍵字前面加上 `pub`，就像範例 7-10 展示的那樣。

<span class="filename">檔案名: src/lib.rs</span>

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

<span class="caption">範例 7-10: 設計公有枚舉，使其所有成員公有</span>

因為我們創建了名為 `Appetizer` 的公有枚舉，所以我們可以在 `eat_at_restaurant` 中使用 `Soup` 和 `Salad` 成員。如果枚舉成員不是公有的，那麼枚舉會顯得用處不大；給枚舉的所有成員挨個添加 `pub` 是很令人惱火的，因此枚舉成員默認就是公有的。結構體通常使用時，不必將它們的欄位公有化，因此結構體遵循常規，內容全部是私有的，除非使用 `pub` 關鍵字。

還有一種使用 `pub` 的場景我們還沒有涉及到，那就是我們最後要講的模組功能：`use` 關鍵字。我們將先單獨介紹 `use`，然後展示如何結合使用 `pub` 和 `use`。

## trait：定義共享的行為

> [ch10-02-traits.md](https://github.com/rust-lang/book/blob/master/src/ch10-02-traits.md)
> <br>
> commit 34b403864ad9c5e27b00b7cc4a6893804ef5b989

*trait* 告訴 Rust 編譯器某個特定類型擁有可能與其他類型共享的功能。可以通過 trait 以一種抽象的方式定義共享的行為。可以使用 *trait bounds* 指定泛型是任何擁有特定行為的類型。

> 注意：*trait* 類似於其他語言中的常被稱為 **介面**（*interfaces*）的功能，雖然有一些不同。

### 定義 trait

一個類型的行為由其可供調用的方法構成。如果可以對不同類型調用相同的方法的話，這些類型就可以共享相同的行為了。trait 定義是一種將方法簽名組合起來的方法，目的是定義一個實現某些目的所必需的行為的集合。

例如，這裡有多個存放了不同類型和屬性文本的結構體：結構體 `NewsArticle` 用於存放發生於世界各地的新聞故事，而結構體 `Tweet` 最多只能存放 280 個字元的內容，以及像是否轉推或是否是對推友的回覆這樣的元數據。

我們想要創建一個多媒體聚合庫用來顯示可能儲存在 `NewsArticle` 或 `Tweet` 實例中的數據的總結。每一個結構體都需要的行為是他們是能夠被總結的，這樣的話就可以調用實例的 `summarize` 方法來請求總結。範例 10-12 中展示了一個表現這個概念的 `Summary` trait 的定義：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

<span class="caption">範例 10-12：`Summary` trait 定義，它包含由 `summarize` 方法提供的行為</span>

這裡使用 `trait` 關鍵字來聲明一個 trait，後面是 trait 的名字，在這個例子中是 `Summary`。在大括號中聲明描述實現這個 trait 的類型所需要的行為的方法簽名，在這個例子中是 `fn summarize(&self) -> String`。

在方法簽名後跟分號，而不是在大括號中提供其實現。接著每一個實現這個 trait 的類型都需要提供其自訂行為的方法體，編譯器也會確保任何實現 `Summary` trait 的類型都擁有與這個簽名的定義完全一致的 `summarize` 方法。

trait 體中可以有多個方法：一行一個方法簽名且都以分號結尾。

### 為類型實現 trait

現在我們定義了 `Summary` trait，接著就可以在多媒體聚合庫中需要擁有這個行為的類型上實現它了。範例 10-13 中展示了 `NewsArticle` 結構體上 `Summary` trait 的一個實現，它使用標題、作者和創建的位置作為 `summarize` 的返回值。對於 `Tweet` 結構體，我們選擇將 `summarize` 定義為使用者名稱後跟推文的全部文本作為返回值，並假設推文內容已經被限制為 280 字元以內。

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Summary {
#     fn summarize(&self) -> String;
# }
#
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

<span class="caption">範例 10-13：在 `NewsArticle` 和 `Tweet` 類型上實現 `Summary` trait</span>

在類型上實現 trait 類似於實現與 trait 無關的方法。區別在於 `impl` 關鍵字之後，我們提供需要實現 trait 的名稱，接著是 `for` 和需要實現 trait 的類型的名稱。在 `impl` 塊中，使用 trait 定義中的方法簽名，不過不再後跟分號，而是需要在大括號中編寫函數體來為特定類型實現 trait 方法所擁有的行為。

一旦實現了 trait，我們就可以用與 `NewsArticle` 和 `Tweet` 實例的非 trait 方法一樣的方式調用 trait 方法了：

```rust,ignore
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from("of course, as you probably already know, people"),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

這會列印出 `1 new tweet: horse_ebooks: of course, as you probably already know, people`。

注意因為範例 10-13 中我們在相同的 *lib.rs* 裡定義了 `Summary` trait 和 `NewsArticle` 與 `Tweet` 類型，所以他們是位於同一作用域的。如果這個 *lib.rs* 是對應 `aggregator` crate 的，而別人想要利用我們 crate 的功能為其自己的庫作用域中的結構體實現 `Summary` trait。首先他們需要將 trait 引入作用域。這可以通過指定 `use aggregator::Summary;` 實現，這樣就可以為其類型實現 `Summary` trait 了。`Summary` 還必須是公有 trait 使得其他 crate 可以實現它，這也是為什麼實例 10-12 中將 `pub` 置於 `trait` 之前。

實現 trait 時需要注意的一個限制是，只有當 trait 或者要實現 trait 的類型位於 crate 的本地作用域時，才能為該類型實現 trait。例如，可以為 `aggregator` crate 的自訂類型 `Tweet` 實現如標準庫中的 `Display` trait，這是因為 `Tweet` 類型位於 `aggregator` crate 本地的作用域中。類似地，也可以在 `aggregator` crate 中為 `Vec<T>` 實現 `Summary`，這是因為 `Summary` trait 位於 `aggregator` crate 本地作用域中。

但是不能為外部類型實現外部 trait。例如，不能在 `aggregator` crate 中為 `Vec<T>` 實現 `Display` trait。這是因為 `Display` 和 `Vec<T>` 都定義於標準庫中，它們並不位於 `aggregator` crate 本地作用域中。這個限制是被稱為 **相干性**（*coherence*） 的程序屬性的一部分，或者更具體的說是 **孤兒規則**（*orphan rule*），其得名於不存在父類型。這條規則確保了其他人編寫的代碼不會破壞你代碼，反之亦然。沒有這條規則的話，兩個 crate 可以分別對相同類型實現相同的 trait，而 Rust 將無從得知應該使用哪一個實現。

### 默認實現

有時為 trait 中的某些或全部方法提供預設的行為，而不是在每個類型的每個實現中都定義自己的行為是很有用的。這樣當為某個特定類型實現 trait 時，可以選擇保留或重載每個方法的默認行為。

範例 10-14 中展示了如何為 `Summary` trait 的 `summarize` 方法指定一個預設的字串值，而不是像範例 10-12 中那樣只是定義方法簽名：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}
```

<span class="caption">範例 10-14：`Summary` trait 的定義，帶有一個 `summarize` 方法的默認實現</span>

如果想要對 `NewsArticle` 實例使用這個默認實現，而不是定義一個自己的實現，則可以通過 `impl Summary for NewsArticle {}` 指定一個空的 `impl` 塊。

雖然我們不再直接為 `NewsArticle` 定義 `summarize` 方法了，但是我們提供了一個默認實現並且指定 `NewsArticle` 實現 `Summary` trait。因此，我們仍然可以對 `NewsArticle` 實例調用 `summarize` 方法，如下所示：

```rust,ignore
let article = NewsArticle {
    headline: String::from("Penguins win the Stanley Cup Championship!"),
    location: String::from("Pittsburgh, PA, USA"),
    author: String::from("Iceburgh"),
    content: String::from("The Pittsburgh Penguins once again are the best
    hockey team in the NHL."),
};

println!("New article available! {}", article.summarize());
```

這段代碼會列印 `New article available! (Read more...)`。

為 `summarize` 創建默認實現並不要求對範例 10-13 中 `Tweet` 上的 `Summary` 實現做任何改變。其原因是重載一個默認實現的語法與實現沒有默認實現的 trait 方法的語法一樣。

默認實現允許調用相同 trait 中的其他方法，哪怕這些方法沒有默認實現。如此，trait 可以提供很多有用的功能而只需要實現指定一小部分內容。例如，我們可以定義 `Summary` trait，使其具有一個需要實現的 `summarize_author` 方法，然後定義一個 `summarize` 方法，此方法的默認實現調用 `summarize_author` 方法：

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}
```

為了使用這個版本的 `Summary`，只需在實現 trait 時定義 `summarize_author` 即可：

```rust,ignore
impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

一旦定義了 `summarize_author`，我們就可以對 `Tweet` 結構體的實例調用 `summarize` 了，而 `summary` 的默認實現會調用我們提供的 `summarize_author` 定義。因為實現了 `summarize_author`，`Summary` trait 就提供了 `summarize` 方法的功能，且無需編寫更多的代碼。

```rust,ignore
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from("of course, as you probably already know, people"),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

這會列印出 `1 new tweet: (Read more from @horse_ebooks...)`。

注意無法從相同方法的重載實現中調用預設方法。

### trait 作為參數

知道了如何定義 trait 和在類型上實現這些 trait 之後，我們可以探索一下如何使用 trait 來接受多種不同類型的參數。

例如在範例 10-13 中為 `NewsArticle` 和 `Tweet` 類型實現了 `Summary` trait。我們可以定義一個函數 `notify` 來調用其參數 `item` 上的 `summarize` 方法，該參數是實現了 `Summary` trait 的某種類型。為此可以使用 `impl Trait` 語法，像這樣：

```rust,ignore
pub fn notify(item: impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

對於 `item` 參數，我們指定了 `impl` 關鍵字和 trait 名稱，而不是具體的類型。該參數支持任何實現了指定 trait 的類型。在 `notify` 函數體中，可以調用任何來自 `Summary` trait 的方法，比如 `summarize`。我們可以傳遞任何 `NewsArticle` 或 `Tweet` 的實例來調用 `notify`。任何用其它如 `String` 或 `i32` 的類型調用該函數的代碼都不能編譯，因為它們沒有實現 `Summary`。

#### Trait Bound 語法

`impl Trait` 語法適用於直觀的例子，它不過是一個較長形式的語法糖。這被稱為 *trait bound*，這看起來像：

```rust,ignore
pub fn notify<T: Summary>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

這與之前的例子相同，不過稍微冗長了一些。trait bound 與泛型參數聲明在一起，位於角括號中的冒號後面。

`impl Trait` 很方便，適用於短小的例子。trait bound 則適用於更複雜的場景。例如，可以獲取兩個實現了 `Summary` 的參數。使用 `impl Trait` 的語法看起來像這樣：

```rust,ignore
pub fn notify(item1: impl Summary, item2: impl Summary) {
```

這適用於 `item1` 和 `item2` 允許是不同類型的情況（只要它們都實現了 `Summary`）。不過如果你希望強制它們都是相同類型呢？這只有在使用 trait bound 時才有可能：

```rust,ignore
pub fn notify<T: Summary>(item1: T, item2: T) {
```

泛型 `T` 被指定為 `item1` 和 `item2` 的參數限制，如此傳遞給參數 `item1` 和 `item2` 值的具體類型必須一致。

#### 通過 `+` 指定多個 trait bound

如果 `notify` 需要顯示 `item` 的格式化形式，同時也要使用 `summarize` 方法，那麼 `item` 就需要同時實現兩個不同的 trait：`Display` 和 `Summary`。這可以通過 `+` 語法實現：

```rust,ignore
pub fn notify(item: impl Summary + Display) {
```

`+` 語法也適用於泛型的 trait bound：

```rust,ignore
pub fn notify<T: Summary + Display>(item: T) {
```

通過指定這兩個 trait bound，`notify` 的函數體可以調用 `summarize` 並使用 `{}` 來格式化 `item`。

#### 通過 `where` 簡化 trait bound

然而，使用過多的 trait bound 也有缺點。每個泛型有其自己的 trait bound，所以有多個泛型參數的函數在名稱和參數列表之間會有很長的 trait bound 訊息，這使得函數簽名難以閱讀。為此，Rust 有另一個在函數簽名之後的 `where` 從句中指定 trait bound 的語法。所以除了這麼寫：

```rust,ignore
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 {
```

還可以像這樣使用 `where` 從句：

```rust,ignore
fn some_function<T, U>(t: T, u: U) -> i32
    where T: Display + Clone,
          U: Clone + Debug
{
```

這個函數簽名就顯得不那麼雜亂，函數名、參數列表和返回值類型都離得很近，看起來類似沒有很多 trait bounds 的函數。

### 返回實現了 trait 的類型

也可以在返回值中使用 `impl Trait` 語法，來返回實現了某個 trait 的類型：

```rust,ignore
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

透過使用 `impl Summary` 作為返回值類型，我們指定了 `returns_summarizable` 函數返回某個實現了 `Summary` trait 的類型，但是不確定其具體的類型。在這個例子中 `returns_summarizable` 返回了一個 `Tweet`，不過調用方並不知情。

返回一個只是指定了需要實現的 trait 的類型的能力在閉包和疊代器場景十分的有用，第十三章會介紹它們。閉包和疊代器創建只有編譯器知道的類型，或者是非常非常長的類型。`impl  Trait` 允許你簡單的指定函數返回一個 `Iterator` 而無需寫出實際的冗長的類型。

不過這只適用於返回單一類型的情況。例如，這段代碼的返回值類型指定為返回 `impl Summary`，但是返回了 `NewsArticle` 或 `Tweet` 就行不通：

```rust,ignore,does_not_compile
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            headline: String::from("Penguins win the Stanley Cup Championship!"),
            location: String::from("Pittsburgh, PA, USA"),
            author: String::from("Iceburgh"),
            content: String::from("The Pittsburgh Penguins once again are the best
            hockey team in the NHL."),
        }
    } else {
        Tweet {
            username: String::from("horse_ebooks"),
            content: String::from("of course, as you probably already know, people"),
            reply: false,
            retweet: false,
        }
    }
}
```

這裡嘗試返回 `NewsArticle` 或 `Tweet`。這不能編譯，因為 `impl Trait` 工作方式的限制。第十七章的 [“為使用不同類型的值而設計的 trait 對象”][using-trait-objects-that-allow-for-values-of-different-types] 部分會介紹如何編寫這樣一個函數。

### 使用 trait bounds 來修復 `largest` 函數

現在你知道了如何使用泛型參數 trait bound 來指定所需的行為。讓我們回到實例 10-5 修復使用泛型類型參數的 `largest` 函數定義！回顧一下，最後嘗試編譯代碼時出現的錯誤是：

```text
error[E0369]: binary operation `>` cannot be applied to type `T`
 --> src/main.rs:5:12
  |
5 |         if item > largest {
  |            ^^^^^^^^^^^^^^
  |
  = note: an implementation of `std::cmp::PartialOrd` might be missing for `T`
```

在 `largest` 函數體中我們想要使用大於運算符（`>`）比較兩個 `T` 類型的值。這個運算符被定義為標準庫中 trait `std::cmp::PartialOrd` 的一個預設方法。所以需要在 `T` 的 trait bound 中指定 `PartialOrd`，這樣 `largest` 函數可以用於任何可以比較大小的類型的 slice。因為 `PartialOrd` 位於 prelude 中所以並不需要手動將其引入作用域。將 `largest` 的簽名修改為如下：

```rust,ignore
fn largest<T: PartialOrd>(list: &[T]) -> T {
```

但是如果編譯代碼的話，會出現一些不同的錯誤：

```text
error[E0508]: cannot move out of type `[T]`, a non-copy slice
 --> src/main.rs:2:23
  |
2 |     let mut largest = list[0];
  |                       ^^^^^^^
  |                       |
  |                       cannot move out of here
  |                       help: consider using a reference instead: `&list[0]`

error[E0507]: cannot move out of borrowed content
 --> src/main.rs:4:9
  |
4 |     for &item in list.iter() {
  |         ^----
  |         ||
  |         |hint: to prevent move, use `ref item` or `ref mut item`
  |         cannot move out of borrowed content
```

錯誤的核心是 `cannot move out of type [T], a non-copy slice`，對於非泛型版本的 `largest` 函數，我們只嘗試了尋找最大的 `i32` 和 `char`。正如第四章 [“只在棧上的數據：拷貝”][stack-only-data-copy]  部分討論過的，像 `i32` 和 `char` 這樣的類型是已知大小的並可以儲存在棧上，所以他們實現了 `Copy` trait。當我們將 `largest` 函數改成使用泛型後，現在 `list` 參數的類型就有可能是沒有實現 `Copy` trait 的。這意味著我們可能不能將 `list[0]` 的值移動到 `largest` 變數中，這導致了上面的錯誤。

為了只對實現了 `Copy` 的類型調用這些程式碼，可以在 `T` 的 trait bounds 中增加 `Copy`！範例 10-15 中展示了一個可以編譯的泛型版本的 `largest` 函數的完整代碼，只要傳遞給 `largest` 的 slice 值的類型實現了 `PartialOrd` **和** `Copy` 這兩個 trait，例如 `i32` 和 `char`：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

<span class="caption">範例 10-15：一個可以用於任何實現了 `PartialOrd` 和 `Copy` trait 的泛型的 `largest` 函數</span>

如果並不希望限制 `largest` 函數只能用於實現了 `Copy` trait 的類型，我們可以在 `T` 的 trait bounds 中指定 `Clone` 而不是 `Copy`。並複製 slice 的每一個值使得 `largest` 函數擁有其所有權。使用 `clone` 函數意味著對於類似 `String` 這樣擁有堆上數據的類型，會潛在的分配更多堆上空間，而堆分配在涉及大量數據時可能會相當緩慢。

另一種 `largest` 的實現方式是返回在 slice 中 `T` 值的引用。如果我們將函數返回值從 `T` 改為 `&T` 並改變函數體使其能夠返回一個引用，我們將不需要任何 `Clone` 或 `Copy` 的 trait bounds 而且也不會有任何的堆分配。嘗試自己實現這種替代解決方式吧！

### 使用 trait bound 有條件地實現方法

透過使用帶有 trait bound 的泛型參數的 `impl` 塊，可以有條件地只為那些實現了特定 trait 的類型實現方法。例如，範例 10-16 中的類型 `Pair<T>` 總是實現了 `new` 方法，不過只有那些為 `T` 類型實現了 `PartialOrd` trait （來允許比較） **和** `Display` trait （來啟用列印）的 `Pair<T>` 才會實現 `cmp_display` 方法：

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self {
            x,
            y,
        }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

<span class="caption">範例 10-16：根據 trait bound 在泛型上有條件的實現方法</span>

也可以對任何實現了特定 trait 的類型有條件地實現 trait。對任何滿足特定 trait bound 的類型實現 trait 被稱為 *blanket implementations*，他們被廣泛的用於 Rust 標準庫中。例如，標準庫為任何實現了 `Display` trait 的類型實現了 `ToString` trait。這個 `impl` 塊看起來像這樣：

```rust,ignore
impl<T: Display> ToString for T {
    // --snip--
}
```

因為標準庫有了這些 blanket implementation，我們可以對任何實現了 `Display` trait 的類型調用由 `ToString` 定義的 `to_string` 方法。例如，可以將整型轉換為對應的 `String` 值，因為整型實現了 `Display`：

```rust
let s = 3.to_string();
```

blanket implementation 會出現在 trait 文件的 “Implementers” 部分。

trait 和 trait bound 讓我們使用泛型類型參數來減少重複，並仍然能夠向編譯器明確指定泛型類型需要擁有哪些行為。因為我們向編譯器提供了 trait bound 訊息，它就可以檢查代碼中所用到的具體類型是否提供了正確的行為。在動態類型語言中，如果我們嘗試調用一個類型並沒有實現的方法，會在運行時出現錯誤。Rust 將這些錯誤移動到了編譯時，甚至在代碼能夠運行之前就強迫我們修復錯誤。另外，我們也無需編寫運行時檢查行為的代碼，因為在編譯時就已經檢查過了，這樣相比其他那些不願放棄泛型靈活性的語言有更好的性能。

這裡還有一種泛型，我們一直在使用它甚至都沒有察覺它的存在，這就是 **生命週期**（*lifetimes*）。不同於其他泛型幫助我們確保類型擁有期望的行為，生命週期則有助於確保引用在我們需要他們的時候一直有效。讓我們學習生命週期是如何做到這些的。

[stack-only-data-copy]:
ch04-01-what-is-ownership.html#stack-only-data-copy
[using-trait-objects-that-allow-for-values-of-different-types]:
ch17-02-trait-objects.html#using-trait-objects-that-allow-for-values-of-different-types

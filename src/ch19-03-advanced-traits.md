## 高級 trait

> [ch19-03-advanced-traits.md](https://github.com/rust-lang/book/blob/master/src/ch19-03-advanced-traits.md)
> <br>
> commit 426f3e4ec17e539ae9905ba559411169d303a031

第十章 [“trait：定義共享的行為”][traits-defining-shared-behavior]  部分，我們第一次涉及到了 trait，不過就像生命週期一樣，我們並沒有覆蓋一些較為高級的細節。現在我們更加了解 Rust 了，可以深入理解其本質了。

### 關聯類型在 trait 定義中指定占位符類型

**關聯類型**（*associated types*）是一個將類型占位符與 trait 相關聯的方式，這樣 trait 的方法簽名中就可以使用這些占位符類型。trait 的實現者會針對特定的實現在這個類型的位置指定相應的具體類型。如此可以定義一個使用多種類型的 trait，直到實現此 trait 時都無需知道這些類型具體是什麼。

本章所描述的大部分內容都非常少見。關聯類型則比較適中；它們比本書其他的內容要少見，不過比本章中的很多內容要更常見。

一個帶有關聯類型的 trait 的例子是標準庫提供的 `Iterator` trait。它有一個叫做 `Item` 的關聯類型來替代遍歷的值的類型。第十三章的 [“`Iterator` trait 和 `next` 方法”][the-iterator-trait-and-the-next-method] 部分曾提到過 `Iterator` trait 的定義如範例 19-12 所示：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

<span class="caption">範例 19-12: `Iterator` trait 的定義中帶有關聯類型 `Item`</span>

`Item` 是一個占位類型，同時 `next` 方法定義表明它返回 `Option<Self::Item>` 類型的值。這個 trait 的實現者會指定 `Item` 的具體類型，然而不管實現者指定何種類型, `next` 方法都會返回一個包含了此具體類型值的 `Option`。

關聯類型看起來像一個類似泛型的概念，因為它允許定義一個函數而不指定其可以處理的類型。那麼為什麼要使用關聯類型呢？

讓我們通過一個在第十三章中出現的 `Counter` 結構體上實現 `Iterator` trait 的例子來檢視其中的區別。在範例 13-21 中，指定了 `Item` 的類型為 `u32`：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        // --snip--
```

這類似於泛型。那麼為什麼 `Iterator` trait 不像範例 19-13 那樣定義呢？

```rust
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
```

<span class="caption">範例 19-21: 一個使用泛型的 `Iterator` trait 假想定義</span>

區別在於當如範例 19-13 那樣使用泛型時，則不得不在每一個實現中標註類型。這是因為我們也可以實現為 `Iterator<String> for Counter`，或任何其他類型，這樣就可以有多個 `Counter` 的 `Iterator` 的實現。換句話說，當 trait 有泛型參數時，可以多次實現這個 trait，每次需改變泛型參數的具體類型。接著當使用 `Counter` 的 `next` 方法時，必須提供類型註解來表明希望使用 `Iterator` 的哪一個實現。

通過關聯類型，則無需標註類型因為不能多次實現這個 trait。對於範例 19-12 使用關聯類型的定義，我們只能選擇一次 `Item` 會是什麼類型，因為只能有一個 `impl Iterator for Counter`。當調用 `Counter` 的 `next` 時不必每次指定我們需要 `u32` 值的疊代器。

### 默認泛型類型參數和運算符重載

當使用泛型類型參數時，可以為泛型指定一個預設的具體類型。如果默認類型就足夠的話，這消除了為具體類型實現 trait 的需要。為泛型類型指定默認類型的語法是在聲明泛型類型時使用 `<PlaceholderType=ConcreteType>`。

這種情況的一個非常好的例子是用於運算符重載。**運算符重載**（*Operator overloading*）是指在特定情況下自訂運算符（比如 `+`）行為的操作。

Rust 並不允許創建自訂運算符或重載任意運算符，不過 `std::ops` 中所列出的運算符和相應的 trait 可以通過實現運算符相關 trait 來重載。例如，範例 19-14 中展示了如何在 `Point` 結構體上實現 `Add` trait 來重載 `+` 運算符，這樣就可以將兩個 `Point` 實例相加了：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
               Point { x: 3, y: 3 });
}
```

<span class="caption">範例 19-14: 實現 `Add` trait 重載 `Point` 實例的 `+` 運算符</span>

`add` 方法將兩個 `Point` 實例的 `x` 值和 `y` 值分別相加來創建一個新的 `Point`。`Add` trait 有一個叫做 `Output` 的關聯類型，它用來決定 `add` 方法的返回值類型。

這裡默認泛型類型位於 `Add` trait 中。這裡是其定義：

```rust
trait Add<RHS=Self> {
    type Output;

    fn add(self, rhs: RHS) -> Self::Output;
}
```

這看來應該很熟悉，這是一個帶有一個方法和一個關聯類型的 trait。比較陌生的部分是角括號中的 `RHS=Self`：這個語法叫做 **默認類型參數**（*default type parameters*）。`RHS` 是一個泛型類型參數（“right hand side” 的縮寫），它用於定義 `add` 方法中的 `rhs` 參數。如果實現 `Add` trait 時不指定 `RHS` 的具體類型，`RHS` 的類型將是默認的 `Self` 類型，也就是在其上實現 `Add` 的類型。

當為 `Point` 實現 `Add` 時，使用了默認的 `RHS`，因為我們希望將兩個 `Point` 實例相加。讓我們看看一個實現 `Add` trait 時希望自訂 `RHS` 類型而不是使用默認類型的例子。

這裡有兩個存放不同單元值的結構體，`Millimeters` 和 `Meters`。我們希望能夠將毫米值與米值相加，並讓 `Add` 的實現正確處理轉換。可以為 `Millimeters` 實現 `Add` 並以 `Meters` 作為 `RHS`，如範例 19-15 所示。

<span class="filename">檔案名: src/lib.rs</span>

```rust
use std::ops::Add;

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

<span class="caption">範例 19-15: 在 `Millimeters` 上實現 `Add`，以便能夠將 `Millimeters` 與 `Meters` 相加</span>

為了使 `Millimeters` 和 `Meters` 能夠相加，我們指定 `impl Add<Meters>` 來設定 `RHS` 類型參數的值而不是使用默認的 `Self`。

默認參數類型主要用於如下兩個方面：

* 擴展類型而不破壞現有代碼。
* 在大部分用戶都不需要的特定情況進行自訂。

標準庫的 `Add` trait 就是一個第二個目的例子：大部分時候你會將兩個相似的類型相加，不過它提供了自訂額外行為的能力。在 `Add` trait 定義中使用默認類型參數意味著大部分時候無需指定額外的參數。換句話說，一小部分實現的樣板代碼是不必要的，這樣使用 trait 就更容易了。

第一個目的是相似的，但過程是反過來的：如果需要為現有 trait 增加類型參數，為其提供一個默認類型將允許我們在不破壞現有實現代碼的基礎上擴展 trait 的功能。

### 完全限定語法與消歧義：調用相同名稱的方法

Rust 既不能避免一個 trait 與另一個 trait 擁有相同名稱的方法，也不能阻止為同一類型同時實現這兩個 trait。甚至直接在類型上實現開始已經有的同名方法也是可能的！

不過，當調用這些同名方法時，需要告訴 Rust 我們希望使用哪一個。考慮一下範例 19-16 中的代碼，這裡定義了 trait `Pilot` 和 `Wizard` 都擁有方法 `fly`。接著在一個本身已經實現了名為 `fly` 方法的類型 `Human` 上實現這兩個 trait。每一個 `fly` 方法都進行了不同的操作：

<span class="filename">檔案名: src/main.rs</span>

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}
```

<span class="caption">範例 19-16: 兩個 trait 定義為擁有 `fly` 方法，並在直接定義有 `fly` 方法的 `Human` 類型上實現這兩個 trait</span>

當調用 `Human` 實例的 `fly` 時，編譯器默認調用直接實現在類型上的方法，如範例 19-17 所示。

<span class="filename">檔案名: src/main.rs</span>

```rust
# trait Pilot {
#     fn fly(&self);
# }
#
# trait Wizard {
#     fn fly(&self);
# }
#
# struct Human;
#
# impl Pilot for Human {
#     fn fly(&self) {
#         println!("This is your captain speaking.");
#     }
# }
#
# impl Wizard for Human {
#     fn fly(&self) {
#         println!("Up!");
#     }
# }
#
# impl Human {
#     fn fly(&self) {
#         println!("*waving arms furiously*");
#     }
# }
#
fn main() {
    let person = Human;
    person.fly();
}
```

<span class="caption">範例 19-17: 調用 `Human` 實例的 `fly`</span>

運行這段代碼會列印出 `*waving arms furiously*`，這表明 Rust 調用了直接實現在 `Human` 上的 `fly` 方法。

為了能夠調用 `Pilot` trait 或 `Wizard` trait 的 `fly` 方法，我們需要使用更明顯的語法以便能指定我們指的是哪個 `fly` 方法。這個語法展示在範例 19-18 中：

<span class="filename">檔案名: src/main.rs</span>

```rust
# trait Pilot {
#     fn fly(&self);
# }
#
# trait Wizard {
#     fn fly(&self);
# }
#
# struct Human;
#
# impl Pilot for Human {
#     fn fly(&self) {
#         println!("This is your captain speaking.");
#     }
# }
#
# impl Wizard for Human {
#     fn fly(&self) {
#         println!("Up!");
#     }
# }
#
# impl Human {
#     fn fly(&self) {
#         println!("*waving arms furiously*");
#     }
# }
#
fn main() {
    let person = Human;
    Pilot::fly(&person);
    Wizard::fly(&person);
    person.fly();
}
```

<span class="caption">範例 19-18: 指定我們希望調用哪一個 trait 的 `fly` 方法</span>

在方法名前指定 trait 名向 Rust 澄清了我們希望調用哪個 `fly` 實現。也可以選擇寫成 `Human::fly(&person)`，這等同於範例 19-18 中的 `person.fly()`，不過如果無需消歧義的話這麼寫就有點長了。

運行這段代碼會列印出：

```text
This is your captain speaking.
Up!
*waving arms furiously*
```

因為 `fly` 方法獲取一個 `self` 參數，如果有兩個 **類型** 都實現了同一 **trait**，Rust 可以根據 `self` 的類型計算出應該使用哪一個 trait 實現。

然而，關聯函數是 trait 的一部分，但沒有 `self` 參數。當同一作用域的兩個類型實現了同一 trait，Rust 就不能計算出我們期望的是哪一個類型，除非使用 **完全限定語法**（*fully qualified syntax*）。例如，拿範例 19-19 中的 `Animal` trait 來說，它有關聯函數 `baby_name`，結構體 `Dog` 實現了 `Animal`，同時有關聯函數 `baby_name` 直接定義於 `Dog` 之上：

<span class="filename">檔案名: src/main.rs</span>

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Dog::baby_name());
}
```

<span class="caption">範例 19-19: 一個帶有關聯函數的 trait 和一個帶有同名關聯函數並實現了此 trait 的類型</span>

這段代碼用於一個動物收容所，他們將所有的小狗起名為 Spot，這實現為定義於 `Dog` 之上的關聯函數 `baby_name`。`Dog` 類型還實現了 `Animal` trait，它描述了所有動物的共有的特徵。小狗被稱為 puppy，這表現為 `Dog` 的 `Animal` trait 實現中與 `Animal` trait 相關聯的函數 `baby_name`。

在 `main` 調用了 `Dog::baby_name` 函數，它直接調用了定義於 `Dog` 之上的關聯函數。這段代碼會列印出：

```text
A baby dog is called a Spot
```

這並不是我們需要的。我們希望調用的是 `Dog` 上 `Animal` trait 實現那部分的 `baby_name` 函數，這樣能夠列印出 `A baby dog is called a puppy`。範例 19-18 中用到的技術在這並不管用；如果將 `main` 改為範例 19-20 中的代碼，則會得到一個編譯錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    println!("A baby dog is called a {}", Animal::baby_name());
}
```

<span class="caption">範例 19-20: 嘗試調用 `Animal` trait 的 `baby_name` 函數，不過 Rust 並不知道該使用哪一個實現</span>

因為 `Animal::baby_name` 是關聯函數而不是方法，因此它沒有 `self` 參數，Rust 無法計算出所需的是哪一個 `Animal::baby_name` 實現。我們會得到這個編譯錯誤：

```text
error[E0283]: type annotations required: cannot resolve `_: Animal`
  --> src/main.rs:20:43
   |
20 |     println!("A baby dog is called a {}", Animal::baby_name());
   |                                           ^^^^^^^^^^^^^^^^^
   |
   = note: required by `Animal::baby_name`
```

為了消歧義並告訴 Rust 我們希望使用的是 `Dog` 的 `Animal` 實現，需要使用 **完全限定語法**，這是調用函數時最為明確的方式。範例 19-21 展示了如何使用完全限定語法：

<span class="filename">檔案名: src/main.rs</span>

```rust
# trait Animal {
#     fn baby_name() -> String;
# }
#
# struct Dog;
#
# impl Dog {
#     fn baby_name() -> String {
#         String::from("Spot")
#     }
# }
#
# impl Animal for Dog {
#     fn baby_name() -> String {
#         String::from("puppy")
#     }
# }
#
fn main() {
    println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
}
```

<span class="caption">範例 19-21: 使用完全限定語法來指定我們希望調用的是 `Dog` 上 `Animal` trait 實現中的 `baby_name` 函數</span>

我們在角括號中向 Rust 提供了類型註解，並透過在此函數調用中將 `Dog` 類型當作 `Animal` 對待，來指定希望調用的是 `Dog` 上 `Animal` trait 實現中的 `baby_name` 函數。現在這段代碼會列印出我們期望的數據：

```text
A baby dog is called a puppy
```

通常，完全限定語法定義為：

```rust,ignore
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

對於關聯函數，其沒有一個 `receiver`，故只會有其他參數的列表。可以選擇在任何函數或方法調用處使用完全限定語法。然而，允許省略任何 Rust 能夠從程序中的其他訊息中計算出的部分。只有當存在多個同名實現而 Rust 需要幫助以便知道我們希望調用哪個實現時，才需要使用這個較為冗長的語法。

### 父 trait 用於在另一個 trait 中使用某 trait 的功能

有時我們可能會需要某個 trait 使用另一個 trait 的功能。在這種情況下，需要能夠依賴相關的 trait 也被實現。這個所需的 trait 是我們實現的 trait 的 **父（超） trait**（*supertrait*）。

例如我們希望創建一個帶有 `outline_print` 方法的 trait `OutlinePrint`，它會列印出帶有星號框的值。也就是說，如果 `Point` 實現了 `Display` 並返回 `(x, y)`，調用以 `1` 作為 `x` 和 `3` 作為 `y` 的 `Point` 實例的 `outline_print` 會顯示如下：

```text
**********
*        *
* (1, 3) *
*        *
**********
```

在 `outline_print` 的實現中，因為希望能夠使用 `Display` trait 的功能，則需要說明 `OutlinePrint` 只能用於同時也實現了 `Display` 並提供了 `OutlinePrint` 需要的功能的類型。可以通過在 trait 定義中指定 `OutlinePrint: Display` 來做到這一點。這類似於為 trait 增加 trait bound。範例 19-22 展示了一個 `OutlinePrint` trait 的實現：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {} *", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

<span class="caption">範例 19-22: 實現 `OutlinePrint` trait，它要求來自 `Display` 的功能</span>

因為指定了 `OutlinePrint` 需要 `Display` trait，則可以在 `outline_print` 中使用 `to_string`， 其會為任何實現 `Display` 的類型自動實現。如果不在 trait 名後增加 `: Display` 並嘗試在 `outline_print` 中使用 `to_string`，則會得到一個錯誤說在當前作用域中沒有找到用於 `&Self` 類型的方法 `to_string`。

讓我們看看如果嘗試在一個沒有實現 `Display` 的類型上實現 `OutlinePrint` 會發生什麼事，比如 `Point` 結構體：

<span class="filename">檔案名: src/main.rs</span>

```rust
# trait OutlinePrint {}
struct Point {
    x: i32,
    y: i32,
}

impl OutlinePrint for Point {}
```

這樣會得到一個錯誤說 `Display` 是必須的而未被實現：

```text
error[E0277]: the trait bound `Point: std::fmt::Display` is not satisfied
  --> src/main.rs:20:6
   |
20 | impl OutlinePrint for Point {}
   |      ^^^^^^^^^^^^ `Point` cannot be formatted with the default formatter;
try using `:?` instead if you are using a format string
   |
   = help: the trait `std::fmt::Display` is not implemented for `Point`
```

一旦在 `Point` 上實現 `Display` 並滿足 `OutlinePrint` 要求的限制，比如這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
# struct Point {
#     x: i32,
#     y: i32,
# }
#
use std::fmt;

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
```

那麼在 `Point` 上實現 `OutlinePrint` trait 將能成功編譯，並可以在 `Point` 實例上調用 `outline_print` 來顯示位於星號框中的點的值。

### newtype 模式用以在外部類型上實現外部 trait

在第十章的 [“為類型實現 trait”][implementing-a-trait-on-a-type] 部分，我們提到了孤兒規則（orphan rule），它說明只要 trait 或類型對於當前 crate 是本地的話就可以在此類型上實現該 trait。一個繞開這個限制的方法是使用 **newtype 模式**（*newtype pattern*），它涉及到在一個元組結構體（第五章 [“用沒有命名欄位的元組結構體來創建不同的類型”][tuple-structs]  部分介紹了元組結構體）中創建一個新類型。這個元組結構體帶有一個欄位作為希望實現 trait 的類型的簡單封裝。接著這個封裝類型對於 crate 是本地的，這樣就可以在這個封裝上實現 trait。*Newtype* 是一個源自 ~~（U.C.0079，逃）~~ Haskell 程式語言的概念。使用這個模式沒有運行時性能懲罰，這個封裝類型在編譯時就被省略了。

例如，如果想要在 `Vec<T>` 上實現 `Display`，而孤兒規則阻止我們直接這麼做，因為 `Display` trait 和 `Vec<T>` 都定義於我們的 crate 之外。可以創建一個包含 `Vec<T>` 實例的 `Wrapper` 結構體，接著可以如列表 19-31 那樣在 `Wrapper` 上實現 `Display` 並使用 `Vec<T>` 的值：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {}", w);
}
```

<span class="caption">範例 19-31: 創建 `Wrapper` 類型封裝 `Vec<String>` 以便能夠實現 `Display`</span>

`Display` 的實現使用 `self.0` 來訪問其內部的 `Vec<T>`，因為 `Wrapper` 是元組結構體而 `Vec<T>` 是結構體總位於索引 0 的項。接著就可以使用 `Wrapper` 中 `Display` 的功能了。

此方法的缺點是，因為 `Wrapper` 是一個新類型，它沒有定義於其值之上的方法；必須直接在 `Wrapper` 上實現 `Vec<T>` 的所有方法，這樣就可以代理到`self.0` 上 —— 這就允許我們完全像 `Vec<T>` 那樣對待 `Wrapper`。如果希望新類型擁有其內部類型的每一個方法，為封裝類型實現 `Deref` trait（第十五章 [“通過 `Deref` trait 將智慧指針當作常規引用處理”][smart-pointer-deref]  部分討論過）並返回其內部類型是一種解決方案。如果不希望封裝類型擁有所有內部類型的方法 —— 比如為了限制封裝類型的行為 —— 則必須只自行實現所需的方法。

上面便是 newtype 模式如何與 trait 結合使用的；還有一個不涉及 trait 的實用模式。現在讓我們將話題的焦點轉移到一些與 Rust 類型系統交互的高級方法上來吧。

[implementing-a-trait-on-a-type]:
ch10-02-traits.html#implementing-a-trait-on-a-type
[the-iterator-trait-and-the-next-method]:
ch13-02-iterators.html#the-iterator-trait-and-the-next-method
[traits-defining-shared-behavior]:
ch10-02-traits.html#traits-defining-shared-behavior
[smart-pointer-deref]: ch15-02-deref.html#treating-smart-pointers-like-regular-references-with-the-deref-trait
[tuple-structs]: ch05-01-defining-structs.html#using-tuple-structs-without-named-fields-to-create-different-types

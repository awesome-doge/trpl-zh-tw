## 方法語法

> [ch05-03-method-syntax.md](https://github.com/rust-lang/book/blob/master/src/ch05-03-method-syntax.md)
> <br>
> commit a86c1d315789b3ca13b20d50ad5005c62bdd9e37

**方法** 與函數類似：它們使用 `fn` 關鍵字和名稱聲明，可以擁有參數和返回值，同時包含在某處調用該方法時會執行的代碼。不過方法與函數是不同的，因為它們在結構體的上下文中被定義（或者是枚舉或 trait 對象的上下文，將分別在第六章和第十七章講解），並且它們第一個參數總是 `self`，它代表調用該方法的結構體實例。

### 定義方法

讓我們把前面實現的獲取一個 `Rectangle` 實例作為參數的 `area` 函數，改寫成一個定義於 `Rectangle` 結構體上的 `area` 方法，如範例 5-13 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

<span class="caption">範例 5-13：在 `Rectangle` 結構體上定義 `area` 方法</span>

為了使函數定義於 `Rectangle` 的上下文中，我們開始了一個 `impl` 塊（`impl` 是 *implementation* 的縮寫）。接著將 `area` 函數移動到 `impl` 大括號中，並將簽名中的第一個（在這裡也是唯一一個）參數和函數體中其他地方的對應參數改成 `self`。然後在 `main` 中將我們先前調用 `area` 方法並傳遞 `rect1` 作為參數的地方，改成使用 **方法語法**（*method syntax*）在 `Rectangle` 實例上調用 `area` 方法。方法語法獲取一個實例並加上一個點號，後跟方法名、圓括號以及任何參數。

在 `area` 的簽名中，使用 `&self` 來替代 `rectangle: &Rectangle`，因為該方法位於 `impl Rectangle` 上下文中所以 Rust 知道 `self` 的類型是 `Rectangle`。注意仍然需要在 `self` 前面加上 `&`，就像 `&Rectangle` 一樣。方法可以選擇獲取 `self` 的所有權，或者像我們這裡一樣不可變地借用 `self`，或者可變地借用 `self`，就跟其他參數一樣。

這裡選擇 `&self` 的理由跟在函數版本中使用 `&Rectangle` 是相同的：我們並不想獲取所有權，只希望能夠讀取結構體中的數據，而不是寫入。如果想要在方法中改變調用方法的實例，需要將第一個參數改為 `&mut self`。透過僅僅使用 `self` 作為第一個參數來使方法獲取實例的所有權是很少見的；這種技術通常用在當方法將 `self` 轉換成別的實例的時候，這時我們想要防止調用者在轉換之後使用原始的實例。

使用方法替代函數，除了可使用方法語法和不需要在每個函數簽名中重複 `self` 的類型之外，其主要好處在於組織性。我們將某個類型實例能做的所有事情都一起放入 `impl` 塊中，而不是讓將來的用戶在我們的庫中到處尋找 `Rectangle` 的功能。

> ### `->` 運算符到哪去了？
>
> 在 C/C++ 語言中，有兩個不同的運算符來調用方法：`.` 直接在對象上調用方法，而 `->` 在一個對象的指針上調用方法，這時需要先解引用（dereference）指針。換句話說，如果 `object` 是一個指針，那麼 `object->something()` 就像 `(*object).something()` 一樣。
>
> Rust 並沒有一個與 `->` 等效的運算符；相反，Rust 有一個叫 **自動引用和解引用**（*automatic referencing and dereferencing*）的功能。方法調用是 Rust 中少數幾個擁有這種行為的地方。
>
> 他是這樣工作的：當使用 `object.something()` 調用方法時，Rust 會自動為 `object` 添加 `&`、`&mut` 或 `*` 以便使 `object` 與方法簽名匹配。也就是說，這些程式碼是等價的：
>
> ```rust
> # #[derive(Debug,Copy,Clone)]
> # struct Point {
> #     x: f64,
> #     y: f64,
> # }
> #
> # impl Point {
> #    fn distance(&self, other: &Point) -> f64 {
> #        let x_squared = f64::powi(other.x - self.x, 2);
> #        let y_squared = f64::powi(other.y - self.y, 2);
> #
> #        f64::sqrt(x_squared + y_squared)
> #    }
> # }
> # let p1 = Point { x: 0.0, y: 0.0 };
> # let p2 = Point { x: 5.0, y: 6.5 };
> p1.distance(&p2);
> (&p1).distance(&p2);
> ```
>
> 第一行看起來簡潔的多。這種自動引用的行為之所以有效，是因為方法有一個明確的接收者———— `self` 的類型。在給出接收者和方法名的前提下，Rust 可以明確地計算出方法是僅僅讀取（`&self`），做出修改（`&mut self`）或者是獲取所有權（`self`）。事實上，Rust 對方法接收者的隱式借用讓所有權在實踐中更友好。

### 帶有更多參數的方法

讓我們通過實現 `Rectangle` 結構體上的另一方法來練習使用方法。這回，我們讓一個 `Rectangle` 的實例獲取另一個 `Rectangle` 實例，如果 `self` 能完全包含第二個長方形則返回 `true`；否則返回 `false`。一旦定義了 `can_hold` 方法，就可以編寫範例 5-14 中的代碼。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

<span class="caption">範例 5-14：使用還未實現的 `can_hold` 方法</span>

同時我們希望看到如下輸出，因為 `rect2` 的兩個維度都小於 `rect1`，而 `rect3` 比 `rect1` 要寬：

```text
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

因為我們想定義一個方法，所以它應該位於 `impl Rectangle` 塊中。方法名是 `can_hold`，並且它會獲取另一個 `Rectangle` 的不可變借用作為參數。透過觀察調用方法的代碼可以看出參數是什麼類型的：`rect1.can_hold(&rect2)` 傳入了 `&rect2`，它是一個 `Rectangle` 的實例 `rect2` 的不可變借用。這是可以理解的，因為我們只需要讀取 `rect2`（而不是寫入，這意味著我們需要一個不可變借用），而且希望 `main` 保持 `rect2` 的所有權，這樣就可以在調用這個方法後繼續使用它。`can_hold` 的返回值是一個布爾值，其實現會分別檢查 `self` 的寬高是否都大於另一個 `Rectangle`。讓我們在範例 5-13 的 `impl` 塊中增加這個新的 `can_hold` 方法，如範例 5-15 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# #[derive(Debug)]
# struct Rectangle {
#     width: u32,
#     height: u32,
# }
#
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

<span class="caption">範例 5-15：在 `Rectangle` 上實現 `can_hold` 方法，它獲取另一個 `Rectangle` 實例作為參數</span>

如果結合範例 5-14 的 `main` 函數來運行，就會看到期望的輸出。在方法簽名中，可以在 `self` 後增加多個參數，而且這些參數就像函數中的參數一樣工作。

### 關聯函數

`impl` 塊的另一個有用的功能是：允許在 `impl` 塊中定義 **不** 以 `self` 作為參數的函數。這被稱為 **關聯函數**（*associated functions*），因為它們與結構體相關聯。它們仍是函數而不是方法，因為它們並不作用於一個結構體的實例。你已經使用過 `String::from` 關聯函數了。

關聯函數經常被用作返回一個結構體新實例的構造函數。例如我們可以提供一個關聯函數，它接受一個維度參數並且同時作為寬和高，這樣可以更輕鬆的創建一個正方形 `Rectangle` 而不必指定兩次同樣的值：

<span class="filename">檔案名: src/main.rs</span>

```rust
# #[derive(Debug)]
# struct Rectangle {
#     width: u32,
#     height: u32,
# }
#
impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}
```

使用結構體名和 `::` 語法來調用這個關聯函數：比如 `let sq = Rectangle::square(3);`。這個方法位於結構體的命名空間中：`::` 語法用於關聯函數和模組創建的命名空間。第七章會講到模組。

### 多個 `impl` 塊

每個結構體都允許擁有多個 `impl` 塊。例如，範例 5-16 中的代碼等同於範例 5-15，但每個方法有其自己的 `impl` 塊。

```rust
# #[derive(Debug)]
# struct Rectangle {
#     width: u32,
#     height: u32,
# }
#
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

<span class="caption">範例 5-16：使用多個 `impl` 塊重寫範例 5-15</span>

這裡沒有理由將這些方法分散在多個 `impl` 塊中，不過這是有效的語法。第十章討論泛型和 trait 時會看到實用的多 `impl` 塊的用例。

## 總結

結構體讓你可以創建出在你的領域中有意義的自訂類型。通過結構體，我們可以將相關聯的數據片段聯繫起來並命名它們，這樣可以使得代碼更加清晰。方法允許為結構體實例指定行為，而關聯函數將特定功能置於結構體的命名空間中並且無需一個實例。

但結構體並不是創建自訂類型的唯一方法：讓我們轉向 Rust 的枚舉功能，為你的工具箱再添一個工具。

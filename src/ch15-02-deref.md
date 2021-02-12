## 通過 `Deref` trait 將智慧指針當作常規引用處理

> [ch15-02-deref.md](https://github.com/rust-lang/book/blob/master/src/ch15-02-deref.md) <br>
> commit 44f1b71c117b0dcec7805eced0b95405167092f6

實現 `Deref` trait 允許我們重載 **解引用運算符**（_dereference operator_）`*`（與乘法運算符或通配符相區別）。透過這種方式實現 `Deref` trait 的智慧指針可以被當作常規引用來對待，可以編寫操作引用的代碼並用於智慧指針。

讓我們首先看看解引用運算符如何處理常規引用，接著嘗試定義我們自己的類似 `Box<T>` 的類型並看看為何解引用運算符不能像引用一樣工作。我們會探索如何實現 `Deref` trait 使得智慧指針以類似引用的方式工作變為可能。最後，我們會討論 Rust 的 **解引用強制多態**（_deref coercions_）功能以及它是如何處理引用或智慧指針的。

> 我們將要構建的 `MyBox<T>` 類型與真正的 `Box<T>` 有一個很大的區別：我們的版本不會在堆上儲存數據。這個例子重點關注 `Deref`，所以其數據實際存放在何處，相比其類似指針的行為來說不算重要。

### 透過解引用運算符追蹤指針的值

常規引用是一個指針類型，一種理解指針的方式是將其看成指向儲存在其他某處值的箭頭。在範例 15-6 中，創建了一個 `i32` 值的引用，接著使用解引用運算符來跟蹤所引用的數據：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

<span class="caption">範例 15-6：使用解引用運算符來跟蹤 `i32` 值的引用</span>

變數 `x` 存放了一個 `i32` 值 `5`。`y` 等於 `x` 的一個引用。可以斷言 `x` 等於 `5`。然而，如果希望對 `y` 的值做出斷言，必須使用 `*y` 來追蹤引用所指向的值（也就是 **解引用**）。一旦解引用了 `y`，就可以訪問 `y` 所指向的整型值並可以與 `5` 做比較。

相反如果嘗試編寫 `assert_eq!(5, y);`，則會得到如下編譯錯誤：

```text
error[E0277]: can't compare `{integer}` with `&{integer}`
 --> src/main.rs:6:5
  |
6 |     assert_eq!(5, y);
  |     ^^^^^^^^^^^^^^^^^ no implementation for `{integer} == &{integer}`
  |
  = help: the trait `std::cmp::PartialEq<&{integer}>` is not implemented for
  `{integer}`
```

不允許比較數字的引用與數字，因為它們是不同的類型。必須使用解引用運算符追蹤引用所指向的值。

### 像引用一樣使用 `Box<T>`

可以使用 `Box<T>` 代替引用來重寫範例 15-6 中的代碼，解引用運算符也一樣能工作，如範例 15-7 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

<span class="caption">範例 15-7：在 `Box<i32>` 上使用解引用運算符</span>

範例 15-7 相比範例 15-6 唯一不同的地方就是將 `y` 設置為一個指向 `x` 值的 box 實例，而不是指向 `x` 值的引用。在最後的斷言中，可以使用解引用運算符以 `y` 為引用時相同的方式追蹤 box 的指針。接下來讓我們通過實現自己的 box 類型來探索 `Box<T>` 能這麼做有何特殊之處。

### 自訂智慧指針

為了體會默認情況下智慧指針與引用的不同，讓我們創建一個類似於標準庫提供的 `Box<T>` 類型的智慧指針。接著學習如何增加使用解引用運算符的功能。

從根本上說，`Box<T>` 被定義為包含一個元素的元組結構體，所以範例 15-8 以相同的方式定義了 `MyBox<T>` 類型。我們還定義了 `new` 函數來對應定義於 `Box<T>` 的 `new` 函數：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}
```

<span class="caption">範例 15-8：定義 `MyBox<T>` 類型</span>

這裡定義了一個結構體 `MyBox` 並聲明了一個泛型參數 `T`，因為我們希望其可以存放任何類型的值。`MyBox` 是一個包含 `T` 類型元素的元組結構體。`MyBox::new` 函數獲取一個 `T` 類型的參數並返回一個存放傳入值的 `MyBox` 實例。

嘗試將範例 15-7 中的代碼加入範例 15-8 中並修改 `main` 使用我們定義的 `MyBox<T>` 類型代替 `Box<T>`。範例 15-9 中的代碼不能編譯，因為 Rust 不知道如何解引用 `MyBox`：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

<span class="caption">範例 15-9：嘗試以使用引用和 `Box<T>` 相同的方式使用 `MyBox<T>`</span>

得到的編譯錯誤是：

```text
error[E0614]: type `MyBox<{integer}>` cannot be dereferenced
  --> src/main.rs:14:19
   |
14 |     assert_eq!(5, *y);
   |                   ^^
```

`MyBox<T>` 類型不能解引用，因為我們尚未在該類型實現這個功能。為了啟用 `*` 運算符的解引用功能，需要實現 `Deref` trait。

### 通過實現 `Deref` trait 將某類型像引用一樣處理

如第十章所討論的，為了實現 trait，需要提供 trait 所需的方法實現。`Deref` trait，由標準庫提供，要求實現名為 `deref` 的方法，其借用 `self` 並返回一個內部數據的引用。範例 15-10 包含定義於 `MyBox` 之上的 `Deref` 實現：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::ops::Deref;

# struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}
```

<span class="caption">範例 15-10：`MyBox<T>` 上的 `Deref` 實現</span>

`type Target = T;` 語法定義了用於此 trait 的關聯類型。關聯類型是一個稍有不同的定義泛型參數的方式，現在還無需過多的擔心它；第十九章會詳細介紹。

`deref` 方法體中寫入了 `&self.0`，這樣 `deref` 返回了我希望通過 `*` 運算符訪問的值的引用。範例 15-9 中的 `main` 函數中對 `MyBox<T>` 值的 `*` 調用現在可以編譯並能通過斷言了！

沒有 `Deref` trait 的話，編譯器只會解引用 `&` 引用類型。`deref` 方法向編譯器提供了獲取任何實現了 `Deref` trait 的類型的值，並且調用這個類型的 `deref` 方法來獲取一個它知道如何解引用的 `&` 引用的能力。

當我們在範例 15-9 中輸入 `*y` 時，Rust 事實上在底層運行了如下代碼：

```rust,ignore
*(y.deref())
```

Rust 將 `*` 運算符替換為先調用 `deref` 方法再進行普通解引用的操作，如此我們便不用擔心是否還需手動調用 `deref` 方法了。Rust 的這個特性可以讓我們寫出行為一致的代碼，無論是面對的是常規引用還是實現了 `Deref` 的類型。

`deref` 方法返回值的引用，以及 `*(y.deref())` 括號外面的普通解引用仍為必須的原因在於所有權。如果 `deref` 方法直接返回值而不是值的引用，其值（的所有權）將被移出 `self`。在這裡以及大部分使用解引用運算符的情況下我們並不希望獲取 `MyBox<T>` 內部值的所有權。

注意，每次當我們在代碼中使用 `*` 時， `*` 運算符都被替換成了先調用 `deref` 方法再接著使用 `*` 解引用的操作，且只會發生一次，不會對 `*` 操作符無限遞迴替換，解引用出上面 `i32` 類型的值就停止了，這個值與範例 15-9 中 `assert_eq!` 的 `5` 相匹配。

### 函數和方法的隱式解引用強制多態

**解引用強制多態**（_deref coercions_）是 Rust 在函數或方法傳參上的一種便利。其將實現了 `Deref` 的類型的引用轉換為原始類型通過 `Deref` 所能夠轉換的類型的引用。當這種特定類型的引用作為實參傳遞給和形參類型不同的函數或方法時，解引用強制多態將自動發生。這時會有一系列的 `deref` 方法被調用，把我們提供的類型轉換成了參數所需的類型。

解引用強制多態的加入使得 Rust 程式設計師編寫函數和方法調用時無需增加過多顯式使用 `&` 和 `*` 的引用和解引用。這個功能也使得我們可以編寫更多同時作用於引用或智慧指針的代碼。

作為展示解引用強制多態的實例，讓我們使用範例 15-8 中定義的 `MyBox<T>`，以及範例 15-10 中增加的 `Deref` 實現。範例 15-11 展示了一個有著字串 slice 參數的函數定義：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn hello(name: &str) {
    println!("Hello, {}!", name);
}
```

<span class="caption">範例 15-11：`hello` 函數有著 `&str` 類型的參數 `name`</span>

可以使用字串 slice 作為參數調用 `hello` 函數，比如 `hello("Rust");`。解引用強制多態使得用 `MyBox<String>` 類型值的引用調用 `hello` 成為可能，如範例 15-12 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::ops::Deref;
#
# struct MyBox<T>(T);
#
# impl<T> MyBox<T> {
#     fn new(x: T) -> MyBox<T> {
#         MyBox(x)
#     }
# }
#
# impl<T> Deref for MyBox<T> {
#     type Target = T;
#
#     fn deref(&self) -> &T {
#         &self.0
#     }
# }
#
# fn hello(name: &str) {
#     println!("Hello, {}!", name);
# }
#
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);
}
```

<span class="caption">範例 15-12：因為解引用強制多態，使用 `MyBox<String>` 的引用調用 `hello` 是可行的</span>

這裡使用 `&m` 調用 `hello` 函數，其為 `MyBox<String>` 值的引用。因為範例 15-10 中在 `MyBox<T>` 上實現了 `Deref` trait，Rust 可以通過 `deref` 調用將 `&MyBox<String>` 變為 `&String`。標準庫中提供了 `String` 上的 `Deref` 實現，其會返回字串 slice，這可以在 `Deref` 的 API 文件中看到。Rust 再次調用 `deref` 將 `&String` 變為 `&str`，這就符合 `hello` 函數的定義了。

如果 Rust 沒有實現解引用強制多態，為了使用 `&MyBox<String>` 類型的值調用 `hello`，則不得不編寫範例 15-13 中的代碼來代替範例 15-12：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::ops::Deref;
#
# struct MyBox<T>(T);
#
# impl<T> MyBox<T> {
#     fn new(x: T) -> MyBox<T> {
#         MyBox(x)
#     }
# }
#
# impl<T> Deref for MyBox<T> {
#     type Target = T;
#
#     fn deref(&self) -> &T {
#         &self.0
#     }
# }
#
# fn hello(name: &str) {
#     println!("Hello, {}!", name);
# }
#
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&(*m)[..]);
}
```

<span class="caption">範例 15-13：如果 Rust 沒有解引用強制多態則必須編寫的代碼</span>

`(*m)` 將 `MyBox<String>` 解引用為 `String`。接著 `&` 和 `[..]` 獲取了整個 `String` 的字串 slice 來匹配 `hello` 的簽名。沒有解引用強制多態所有這些符號混在一起將更難以讀寫和理解。解引用強制多態使得 Rust 自動的幫我們處理這些轉換。

當所涉及到的類型定義了 `Deref` trait，Rust 會分析這些類型並使用任意多次 `Deref::deref` 調用以獲得匹配參數的類型。這些解析都發生在編譯時，所以利用解引用強制多態並沒有運行時懲罰！

### 解引用強制多態如何與可變性交互

類似於如何使用 `Deref` trait 重載不可變引用的 `*` 運算符，Rust 提供了 `DerefMut` trait 用於重載可變引用的 `*` 運算符。

Rust 在發現類型和 trait 實現滿足三種情況時會進行解引用強制多態：

- 當 `T: Deref<Target=U>` 時從 `&T` 到 `&U`。
- 當 `T: DerefMut<Target=U>` 時從 `&mut T` 到 `&mut U`。
- 當 `T: Deref<Target=U>` 時從 `&mut T` 到 `&U`。

頭兩個情況除了可變性之外是相同的：第一種情況表明如果有一個 `&T`，而 `T` 實現了返回 `U` 類型的 `Deref`，則可以直接得到 `&U`。第二種情況表明對於可變引用也有著相同的行為。

第三個情況有些微妙：Rust 也會將可變引用強轉為不可變引用。但是反之是 **不可能** 的：不可變引用永遠也不能強轉為可變引用。因為根據借用規則，如果有一個可變引用，其必須是這些數據的唯一引用（否則程序將無法編譯）。將一個可變引用轉換為不可變引用永遠也不會打破借用規則。將不可變引用轉換為可變引用則需要數據只能有一個不可變引用，而借用規則無法保證這一點。因此，Rust 無法假設將不可變引用轉換為可變引用是可能的。

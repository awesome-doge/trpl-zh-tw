## 所有的模式語法

> [ch18-03-pattern-syntax.md](https://github.com/rust-lang/book/blob/master/src/ch18-03-pattern-syntax.md)
> <br>
> commit 86f0ae4831f24b3c429fa4845b900b4cad903a8b

通過本書我們已領略過許多不同類型模式的例子。在本節中，我們收集了模式中所有有效的語法，並討論了為什麼可能要使用每個語法。

### 匹配字面值

如第六章所示，可以直接匹配字面值模式。如下代碼給出了一些例子：

```rust
let x = 1;

match x {
    1 => println!("one"),
    2 => println!("two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

這段代碼會列印 `one` 因為 `x` 的值是 1。如果希望代碼獲得特定的具體值，則該語法很有用。

### 匹配命名變數

命名變數是匹配任何值的不可反駁模式，這在之前已經使用過數次。然而當其用於 `match` 表達式時情況會有些複雜。因為 `match` 會開始一個新作用域，`match` 表達式中作為模式的一部分聲明的變數會覆蓋 `match` 結構之外的同名變數，與所有變數一樣。在範例 18-11 中，聲明了一個值為 `Some(5)` 的變數 `x` 和一個值為 `10` 的變數 `y`。接著在值 `x` 上創建了一個 `match` 表達式。觀察匹配分支中的模式和結尾的 `println!`，並在運行此代碼或進一步閱讀之前推斷這段代碼會列印什麼。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {:?}", y),
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {:?}", x, y);
}
```

<span class="caption">範例 18-11: 一個 `match` 語句其中一個分支引入了覆蓋變數 `y`</span>

讓我們看看當 `match` 語句運行的時候發生了什麼事。第一個匹配分支的模式並不匹配 `x` 中定義的值，所以代碼繼續執行。

第二個匹配分支中的模式引入了一個新變數 `y`，它會匹配任何 `Some` 中的值。因為我們在 `match` 表達式的新作用域中，這是一個新變數，而不是開頭聲明為值 10 的那個 `y`。這個新的 `y` 綁定會匹配任何 `Some` 中的值，在這裡是 `x` 中的值。因此這個 `y` 綁定了 `x` 中 `Some` 內部的值。這個值是 5，所以這個分支的表達式將會執行並列印出 `Matched, y = 5`。

如果 `x` 的值是 `None` 而不是 `Some(5)`，頭兩個分支的模式不會匹配，所以會匹配下劃線。這個分支的模式中沒有引入變數 `x`，所以此時表達式中的 `x` 會是外部沒有被覆蓋的 `x`。在這個假想的例子中，`match` 將會列印 `Default case, x = None`。

一旦 `match` 表達式執行完畢，其作用域也就結束了，同理內部 `y` 的作用域也結束了。最後的 `println!` 會列印 `at the end: x = Some(5), y = 10`。

為了創建能夠比較外部 `x` 和 `y` 的值，而不引入覆蓋變數的 `match` 表達式，我們需要相應地使用帶有條件的匹配守衛（match guard）。我們稍後將在 [“匹配守衛提供的額外條件”](#extra-conditionals-with-match-guards) 這一小節討論匹配守衛。

### 多個模式

在 `match` 表達式中，可以使用 `|` 語法匹配多個模式，它代表 **或**（*or*）的意思。例如，如下代碼將 `x` 的值與匹配分支相比較，第一個分支有 **或** 選項，意味著如果 `x` 的值匹配此分支的任一個值，它就會運行：

```rust
let x = 1;

match x {
    1 | 2 => println!("one or two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

上面的代碼會列印 `one or two`。

### 通過 `..=` 匹配值的範圍

`..=` 語法允許你匹配一個閉區間範圍內的值。在如下代碼中，當模式匹配任何在此範圍內的值時，該分支會執行：

```rust
let x = 5;

match x {
    1..=5 => println!("one through five"),
    _ => println!("something else"),
}
```

如果 `x` 是 1、2、3、4 或 5，第一個分支就會匹配。這相比使用 `|` 運算符表達相同的意思更為方便；相比 `1..=5`，使用 `|` 則不得不指定 `1 | 2 | 3 | 4 | 5`。相反指定範圍就簡短的多，特別是在希望匹配比如從 1 到 1000 的數字的時候！

範圍只允許用於數字或 `char` 值，因為編譯器會在編譯時檢查範圍不為空。`char` 和 數字值是 Rust 僅有的可以判斷範圍是否為空的類型。

如下是一個使用 `char` 類型值範圍的例子：

```rust
let x = 'c';

match x {
    'a'..='j' => println!("early ASCII letter"),
    'k'..='z' => println!("late ASCII letter"),
    _ => println!("something else"),
}
```

Rust 知道 `c` 位於第一個模式的範圍內，並會列印出 `early ASCII letter`。

### 解構並分解值

也可以使用模式來解構結構體、枚舉、元組和引用，以便使用這些值的不同部分。讓我們來分別看一看。

#### 解構結構體

範例 18-12 展示帶有兩個欄位 `x` 和 `y` 的結構體 `Point`，可以通過帶有模式的 `let` 語句將其分解：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
```

<span class="caption">範例 18-12: 解構一個結構體的欄位為單獨的變數</span>

這段代碼創建了變數 `a` 和 `b` 來匹配結構體 `p` 中的 `x` 和 `y` 欄位。這個例子展示了模式中的變數名不必與結構體中的欄位名一致。不過通常希望變數名與欄位名一致以便於理解變數來自於哪些欄位。

因為變數名匹配欄位名是常見的，同時因為 `let Point { x: x, y: y } = p;` 包含了很多重複，所以對於匹配結構體欄位的模式存在簡寫：只需列出結構體欄位的名稱，則模式創建的變數會有相同的名稱。範例 18-13 展示了與範例 18-12 有著相同行為的代碼，不過 `let` 模式創建的變數為 `x` 和 `y` 而不是 `a` 和 `b`：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

<span class="caption">範例 18-13: 使用結構體欄位簡寫來解構結構體欄位</span>

這段代碼創建了變數 `x` 和 `y`，與變數 `p` 中的 `x` 和 `y` 相匹配。其結果是變數 `x` 和 `y` 包含結構體 `p` 中的值。

也可以使用字面值作為結構體模式的一部分進行進行解構，而不是為所有的欄位創建變數。這允許我們測試一些欄位為特定值的同時創建其他欄位的變數。

範例 18-14 展示了一個 `match` 語句將 `Point` 值分成了三種情況：直接位於 `x` 軸上（此時 `y = 0` 為真）、位於 `y` 軸上（`x = 0`）或不在任何軸上的點。

<span class="filename">檔案名: src/main.rs</span>

```rust
# struct Point {
#     x: i32,
#     y: i32,
# }
#
fn main() {
    let p = Point { x: 0, y: 7 };

    match p {
        Point { x, y: 0 } => println!("On the x axis at {}", x),
        Point { x: 0, y } => println!("On the y axis at {}", y),
        Point { x, y } => println!("On neither axis: ({}, {})", x, y),
    }
}
```

<span class="caption">範例 18-14: 解構和匹配模式中的字面值</span>

第一個分支通過指定欄位 `y` 匹配字面值 `0` 來匹配任何位於 `x` 軸上的點。此模式仍然創建了變數 `x` 以便在分支的代碼中使用。

類似的，第二個分支通過指定欄位 `x` 匹配字面值 `0` 來匹配任何位於 `y` 軸上的點，並為欄位 `y` 創建了變數 `y`。第三個分支沒有指定任何字面值，所以其會匹配任何其他的 `Point` 並為 `x` 和 `y` 兩個欄位創建變數。

在這個例子中，值 `p` 因為其 `x` 包含 0 而匹配第二個分支，因此會列印出 `On the y axis at 7`。

#### 解構枚舉

本書之前的部分曾經解構過枚舉，比如第六章中範例 6-5 中解構了一個 `Option<i32>`。一個當時沒有明確提到的細節是解構枚舉的模式需要對應枚舉所定義的儲存數據的方式。讓我們以範例 6-2 中的 `Message` 枚舉為例，編寫一個 `match` 使用模式解構每一個內部值，如範例 18-15 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.")
        }
        Message::Move { x, y } => {
            println!(
                "Move in the x direction {} and in the y direction {}",
                x,
                y
            );
        }
        Message::Write(text) => println!("Text message: {}", text),
        Message::ChangeColor(r, g, b) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
    }
}
```

<span class="caption">範例 18-15: 解構包含不同類型值成員的枚舉</span>

這段代碼會列印出 `Change the color to red 0, green 160, and blue 255`。嘗試改變 `msg` 的值來觀察其他分支代碼的運行。

對於像 `Message::Quit` 這樣沒有任何數據的枚舉成員，不能進一步解構其值。只能匹配其字面值 `Message::Quit`，因此模式中沒有任何變數。

對於像 `Message::Move` 這樣的類結構體枚舉成員，可以採用類似於匹配結構體的模式。在成員名稱後，使用大括號並列出欄位變數以便將其分解以供此分支的代碼使用。這裡使用了範例 18-13 所展示的簡寫。

對於像 `Message::Write` 這樣的包含一個元素，以及像 `Message::ChangeColor` 這樣包含三個元素的類元組枚舉成員，其模式則類似於用於解構元組的模式。模式中變數的數量必須與成員中元素的數量一致。

#### 解構嵌套的結構體和枚舉

目前為止，所有的例子都只匹配了深度為一級的結構體或枚舉。當然也可以匹配嵌套的項！

例如，我們可以重構列表 18-15 的代碼來同時支持 RGB 和 HSV 色彩模式：

```rust
enum Color {
   Rgb(i32, i32, i32),
   Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!(
                "Change the color to hue {}, saturation {}, and value {}",
                h,
                s,
                v
            )
        }
        _ => ()
    }
}
```

<span class="caption">範例 18-16: 匹配嵌套的枚舉</span>

`match` 表達式第一個分支的模式匹配一個包含 `Color::Rgb` 枚舉成員的 `Message::ChangeColor` 枚舉成員，然後模式綁定了 3 個內部的 `i32` 值。第二個分支的模式也匹配一個 `Message::ChangeColor` 枚舉成員， 但是其內部的枚舉會匹配 `Color::Hsv` 枚舉成員。我們可以在一個 `match` 表達式中指定這些複雜條件，即使會涉及到兩個枚舉。

#### 解構結構體和元組

甚至可以用複雜的方式來混合、匹配和嵌套解構模式。如下是一個複雜結構體的例子，其中結構體和元組嵌套在元組中，並將所有的原始類型解構出來：

```rust
# struct Point {
#     x: i32,
#     y: i32,
# }
#
let ((feet, inches), Point {x, y}) = ((3, 10), Point { x: 3, y: -10 });
```

這將複雜的類型分解成部分組件以便可以單獨使用我們感興趣的值。

透過模式解構是一個方便利用部分值片段的手段，比如結構體中每個單獨欄位的值。

### 忽略模式中的值

有時忽略模式中的一些值是有用的，比如 `match` 中最後捕獲全部情況的分支實際上沒有做任何事，但是它確實對所有剩餘情況負責。有一些簡單的方法可以忽略模式中全部或部分值：使用 `_` 模式（我們已經見過了），在另一個模式中使用 `_` 模式，使用一個以下劃線開始的名稱，或者使用 `..` 忽略所剩部分的值。讓我們來分別探索如何以及為什麼要這麼做。

#### 使用 `_` 忽略整個值

我們已經使用過下劃線（`_`）作為匹配但不綁定任何值的通配符模式了。雖然 `_` 模式作為 `match` 表達式最後的分支特別有用，也可以將其用於任意模式，包括函數參數中，如範例 18-17 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {}", y);
}

fn main() {
    foo(3, 4);
}
```

<span class="caption">範例 18-17: 在函數簽名中使用 `_`</span>

這段代碼會完全忽略作為第一個參數傳遞的值 `3`，並會列印出 `This code only uses the y parameter: 4`。

大部分情況當你不再需要特定函數參數時，最好修改簽名不再包含無用的參數。在一些情況下忽略函數參數會變得特別有用，比如實現 trait 時，當你需要特定類型簽名但是函數實現並不需要某個參數時。此時編譯器就不會警告說存在未使用的函數參數，就跟使用命名參數一樣。

#### 使用嵌套的 `_` 忽略部分值

也可以在一個模式內部使用`_` 忽略部分值，例如，當只需要測試部分值但在期望運行的代碼中沒有用到其他部分時。範例 18-18 展示了負責管理設置值的代碼。業務需求是用戶不允許覆蓋現有的自訂設置，但是可以取消設置，也可以在當前未設置時為其提供設置。

```rust
let mut setting_value = Some(5);
let new_setting_value = Some(10);

match (setting_value, new_setting_value) {
    (Some(_), Some(_)) => {
        println!("Can't overwrite an existing customized value");
    }
    _ => {
        setting_value = new_setting_value;
    }
}

println!("setting is {:?}", setting_value);
```

<span class="caption">範例 18-18: 當不需要 `Some` 中的值時在模式內使用下劃線來匹配 `Some` 成員</span>

這段代碼會列印出 `Can't overwrite an existing customized value` 接著是 `setting is Some(5)`。在第一個匹配分支，我們不需要匹配或使用任一個 `Some` 成員中的值；重要的部分是需要測試 `setting_value` 和 `new_setting_value` 都為 `Some` 成員的情況。在這種情況，我們列印出為何不改變 `setting_value`，並且不會改變它。

對於所有其他情況（`setting_value` 或 `new_setting_value` 任一為 `None`），這由第二個分支的 `_` 模式體現，這時確實希望允許 `new_setting_value` 變為 `setting_value`。

也可以在一個模式中的多處使用下劃線來忽略特定值，如範例 18-19 所示，這裡忽略了一個五元元組中的第二和第四個值：

```rust
let numbers = (2, 4, 8, 16, 32);

match numbers {
    (first, _, third, _, fifth) => {
        println!("Some numbers: {}, {}, {}", first, third, fifth)
    },
}
```

<span class="caption">範例 18-19: 忽略元組的多個部分</span>

這會列印出 `Some numbers: 2, 8, 32`, 值 4 和 16 會被忽略。

#### 透過在名字前以一個下劃線開頭來忽略未使用的變數

如果你創建了一個變數卻不在任何地方使用它, Rust 通常會給你一個警告，因為這可能會是個 bug。但是有時創建一個還未使用的變數是有用的，比如你正在設計原型或剛剛開始一個項目。這時你希望告訴 Rust 不要警告未使用的變數，為此可以用下劃線作為變數名的開頭。範例 18-20 中創建了兩個未使用變數，不過當運行程式碼時只會得到其中一個的警告：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let _x = 5;
    let y = 10;
}
```

<span class="caption">範例 18-20: 以下劃線開始變數名以便去掉未使用變數警告</span>

這裡得到了警告說未使用變數 `y`，不過沒有警告說未使用下劃線開頭的變數。

注意, 只使用 `_` 和使用以下劃線開頭的名稱有些微妙的不同：比如 `_x` 仍會將值綁定到變數，而 `_` 則完全不會綁定。為了展示這個區別的意義，範例 18-21 會產生一個錯誤。

```rust,ignore,does_not_compile
let s = Some(String::from("Hello!"));

if let Some(_s) = s {
    println!("found a string");
}

println!("{:?}", s);
```

<span class="caption">範例 18-21: 以下劃線開頭的未使用變數仍然會綁定值，它可能會獲取值的所有權</span>

我們會得到一個錯誤，因為 `s` 的值仍然會移動進 `_s`，並阻止我們再次使用 `s`。然而只使用下劃線本身，並不會綁定值。範例 18-22 能夠無錯編譯，因為 `s` 沒有被移動進 `_`：

```rust
let s = Some(String::from("Hello!"));

if let Some(_) = s {
    println!("found a string");
}

println!("{:?}", s);
```

<span class="caption">範例 18-22: 單獨使用下劃線不會綁定值</span>

上面的代碼能很好的運行；因為沒有把 `s` 綁定到任何變數；它沒有被移動。

#### 用 `..` 忽略剩餘值

對於有多個部分的值，可以使用 `..` 語法來只使用部分並忽略其它值，同時避免不得不每一個忽略值列出下劃線。`..` 模式會忽略模式中剩餘的任何沒有顯式匹配的值部分。在範例 18-23 中，有一個 `Point` 結構體存放了三維空間中的坐標。在 `match` 表達式中，我們希望只操作 `x` 坐標並忽略 `y` 和 `z` 欄位的值：

```rust
struct Point {
    x: i32,
    y: i32,
    z: i32,
}

let origin = Point { x: 0, y: 0, z: 0 };

match origin {
    Point { x, .. } => println!("x is {}", x),
}
```

<span class="caption">範例 18-23: 透過使用 `..` 來忽略 `Point` 中除 `x` 以外的欄位</span>

這裡列出了 `x` 值，接著僅僅包含了 `..` 模式。這比不得不列出 `y: _` 和 `z: _` 要來得簡單，特別是在處理有很多欄位的結構體，但只涉及一到兩個欄位時的情形。

`..` 會擴展為所需要的值的數量。範例 18-24 展示了元組中 `..` 的應用：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {}, {}", first, last);
        },
    }
}
```

<span class="caption">範例 18-24: 只匹配元組中的第一個和最後一個值並忽略掉所有其它值</span>

這裡用 `first` 和 `last` 來匹配第一個和最後一個值。`..` 將匹配並忽略中間的所有值。

然而使用 `..` 必須是無歧義的。如果期望匹配和忽略的值是不明確的，Rust 會報錯。範例 18-25 展示了一個帶有歧義的 `..` 例子，因此其不能編譯：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (.., second, ..) => {
            println!("Some numbers: {}", second)
        },
    }
}
```

<span class="caption">範例 18-25: 嘗試以有歧義的方式運用 `..`</span>

如果編譯上面的例子，會得到下面的錯誤：

```text
error: `..` can only be used once per tuple or tuple struct pattern
 --> src/main.rs:5:22
  |
5 |         (.., second, ..) => {
  |                      ^^
```

Rust 不可能決定在元組中匹配 `second` 值之前應該忽略多少個值，以及在之後忽略多少個值。這段代碼可能表明我們意在忽略 `2`，綁定 `second` 為 `4`，接著忽略 `8`、`16` 和 `32`；抑或是意在忽略 `2` 和 `4`，綁定 `second` 為 `8`，接著忽略 `16` 和 `32`，以此類推。變數名 `second` 對於 Rust 來說並沒有任何特殊意義，所以會得到編譯錯誤，因為在這兩個地方使用 `..` 是有歧義的。

### 匹配守衛提供的額外條件

**匹配守衛**（*match guard*）是一個指定於 `match` 分支模式之後的額外 `if` 條件，它也必須被滿足才能選擇此分支。匹配守衛用於表達比單獨的模式所能允許的更為複雜的情況。

這個條件可以使用模式中創建的變數。範例 18-26 展示了一個 `match`，其中第一個分支有模式 `Some(x)` 還有匹配守衛 `if x < 5`：

```rust
let num = Some(4);

match num {
    Some(x) if x < 5 => println!("less than five: {}", x),
    Some(x) => println!("{}", x),
    None => (),
}
```

<span class="caption">範例 18-26: 在模式中加入匹配守衛</span>

上例會列印出 `less than five: 4`。當 `num` 與模式中第一個分支比較時，因為 `Some(4)` 匹配 `Some(x)` 所以可以匹配。接著匹配守衛檢查 `x` 值是否小於 `5`，因為 `4` 小於 `5`，所以第一個分支被選擇。

相反如果 `num` 為 `Some(10)`，因為 10 不小於 5 所以第一個分支的匹配守衛為假。接著 Rust 會前往第二個分支，這會匹配因為它沒有匹配守衛所以會匹配任何 `Some` 成員。

無法在模式中表達 `if x < 5` 的條件，所以匹配守衛提供了表現此邏輯的能力。

在範例 18-11 中，我們提到可以使用匹配守衛來解決模式中變數覆蓋的問題，那裡 `match` 表達式的模式中新建了一個變數而不是使用 `match` 之外的同名變數。新變數意味著不能夠測試外部變數的值。範例 18-27 展示了如何使用匹配守衛修復這個問題。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {}", n),
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {}", x, y);
}
```

<span class="caption">範例 18-27: 使用匹配守衛來測試與外部變數的相等性</span>

現在這會列印出 `Default case, x = Some(5)`。現在第二個匹配分支中的模式不會引入一個覆蓋外部 `y` 的新變數 `y`，這意味著可以在匹配守衛中使用外部的 `y`。相比指定會覆蓋外部 `y` 的模式 `Some(y)`，這裡指定為 `Some(n)`。此新建的變數 `n` 並沒有覆蓋任何值，因為 `match` 外部沒有變數 `n`。

匹配守衛 `if n == y` 並不是一個模式所以沒有引入新變數。這個 `y` **正是** 外部的 `y` 而不是新的覆蓋變數 `y`，這樣就可以通過比較 `n` 和 `y` 來表達尋找一個與外部 `y` 相同的值的概念了。

也可以在匹配守衛中使用 **或** 運算符 `|` 來指定多個模式，同時匹配守衛的條件會作用於所有的模式。範例 18-28 展示了結合匹配守衛與使用了 `|` 的模式的優先度。這個例子中重要的部分是匹配守衛 `if y` 作用於 `4`、`5` **和** `6`，即使這看起來好像 `if y` 只作用於 `6`：

```rust
let x = 4;
let y = false;

match x {
    4 | 5 | 6 if y => println!("yes"),
    _ => println!("no"),
}
```

<span class="caption">範例 18-28: 結合多個模式與匹配守衛</span>

這個匹配條件表明此分支值匹配 `x` 值為 `4`、`5` 或 `6` **同時** `y` 為 `true` 的情況。運行這段代碼時會發生的是第一個分支的模式因 `x` 為 `4` 而匹配，不過匹配守衛 `if y` 為假，所以第一個分支不會被選擇。代碼移動到第二個分支，這會匹配，此程序會列印出 `no`。這是因為 `if` 條件作用於整個 `4 | 5 | 6` 模式，而不僅是最後的值 `6`。換句話說，匹配守衛與模式的優先度關係看起來像這樣：

```text
(4 | 5 | 6) if y => ...
```

而不是：

```text
4 | 5 | (6 if y) => ...
```

可以通過運行程式碼時的情況看出這一點：如果匹配守衛只作用於由 `|` 運算符指定的值列表的最後一個值，這個分支就會匹配且程序會列印出 `yes`。

### `@` 綁定

*at* 運算符（`@`）允許我們在創建一個存放值的變數的同時測試其值是否匹配模式。範例 18-29 展示了一個例子，這裡我們希望測試 `Message::Hello` 的 `id` 欄位是否位於 `3..=7` 範圍內，同時也希望能將其值綁定到 `id_variable` 變數中以便此分支相關聯的代碼可以使用它。可以將 `id_variable` 命名為 `id`，與欄位同名，不過出於範例的目的這裡選擇了不同的名稱。

```rust
enum Message {
    Hello { id: i32 },
}

let msg = Message::Hello { id: 5 };

match msg {
    Message::Hello { id: id_variable @ 3..=7 } => {
        println!("Found an id in range: {}", id_variable)
    },
    Message::Hello { id: 10..=12 } => {
        println!("Found an id in another range")
    },
    Message::Hello { id } => {
        println!("Found some other id: {}", id)
    },
}
```

<span class="caption">範例 18-29: 使用 `@` 在模式中綁定值的同時測試它</span>

上例會列印出 `Found an id in range: 5`。通過在 `3..=7` 之前指定 `id_variable @`，我們捕獲了任何匹配此範圍的值並同時測試其值匹配這個範圍模式。

第二個分支只在模式中指定了一個範圍，分支相關代碼代碼沒有一個包含 `id` 欄位實際值的變數。`id` 欄位的值可以是 10、11 或 12，不過這個模式的代碼並不知情也不能使用 `id` 欄位中的值，因為沒有將 `id` 值保存進一個變數。

最後一個分支指定了一個沒有範圍的變數，此時確實擁有可以用於分支代碼的變數 `id`，因為這裡使用了結構體欄位簡寫語法。不過此分支中沒有像頭兩個分支那樣對 `id` 欄位的值進行測試：任何值都會匹配此分支。

使用 `@` 可以在一個模式中同時測試和保存變數值。

## 總結

模式是 Rust 中一個很有用的功能，它幫助我們區分不同類型的數據。當用於 `match` 語句時，Rust 確保模式會包含每一個可能的值，否則程序將不能編譯。`let` 語句和函數參數的模式使得這些結構更強大，可以在將值解構為更小部分的同時為變數賦值。可以創建簡單或複雜的模式來滿足我們的要求。

接下來，在本書倒數第二章中，我們將介紹一些 Rust 眾多功能中較為高級的部分。

## 泛型數據類型

> [ch10-01-syntax.md](https://github.com/rust-lang/book/blob/master/src/ch10-01-syntax.md)
> <br>
> commit af34ac954a6bd7fc4a8bbcc5c9685e23c5af87da

我們可以使用泛型為像函數簽名或結構體這樣的項創建定義，這樣它們就可以用於多種不同的具體數據類型。讓我們看看如何使用泛型定義函數、結構體、枚舉和方法，然後我們將討論泛型如何影響代碼性能。

### 在函數定義中使用泛型

當使用泛型定義函數時，本來在函數簽名中指定參數和返回值的類型的地方，會改用泛型來表示。採用這種技術，使得代碼適應性更強，從而為函數的調用者提供更多的功能，同時也避免了代碼的重複。

回到 `largest` 函數，範例 10-4 中展示了兩個函數，它們的功能都是尋找 slice 中最大值。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn largest_i32(list: &[i32]) -> i32 {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn largest_char(list: &[char]) -> char {
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

    let result = largest_i32(&number_list);
    println!("The largest number is {}", result);
#    assert_eq!(result, 100);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest_char(&char_list);
    println!("The largest char is {}", result);
#    assert_eq!(result, 'y');
}
```

<span class="caption">範例 10-4：兩個函數，不同點只是名稱和簽名類型</span>

`largest_i32` 函數是從範例 10-3 中摘出來的，它用來尋找 slice 中最大的 `i32`。`largest_char` 函數尋找 slice 中最大的 `char`。因為兩者函數體的代碼是一樣的，我們可以定義一個函數，再引進泛型參數來消除這種重複。

為了參數化新函數中的這些類型，我們也需要為類型參數取個名字，道理和給函數的形參起名一樣。任何標識符都可以作為類型參數的名字。這裡選用 `T`，因為傳統上來說，Rust 的參數名字都比較短，通常就只有一個字母，同時，Rust 類型名的命名規範是駱駝命名法（CamelCase）。`T` 作為 “type” 的縮寫是大部分 Rust 程式設計師的首選。

如果要在函數體中使用參數，就必須在函數簽名中聲明它的名字，好讓編譯器知道這個名字指代的是什麼。同理，當在函數簽名中使用一個類型參數時，必須在使用它之前就聲明它。為了定義泛型版本的 `largest` 函數，類型參數聲明位於函數名稱與參數列表中間的角括號 `<>` 中，像這樣：

```rust,ignore
fn largest<T>(list: &[T]) -> T {
```

可以這樣理解這個定義：函數 `largest` 有泛型類型 `T`。它有個參數 `list`，其類型是元素為 `T` 的 slice。`largest` 函數的返回值類型也是 `T`。

範例 10-5 中的 `largest` 函數在它的簽名中使用了泛型，統一了兩個實現。該範例也展示了如何調用 `largest` 函數，把 `i32` 值的 slice 或 `char` 值的 slice 傳給它。請注意這些程式碼還不能編譯，不過稍後在本章會解決這個問題。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn largest<T>(list: &[T]) -> T {
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

<span class="caption">範例 10-5：一個使用泛型參數的 `largest` 函數定義，尚不能編譯</span>

如果現在就編譯這個代碼，會出現如下錯誤：

```text
error[E0369]: binary operation `>` cannot be applied to type `T`
 --> src/main.rs:5:12
  |
5 |         if item > largest {
  |            ^^^^^^^^^^^^^^
  |
  = note: an implementation of `std::cmp::PartialOrd` might be missing for `T`
```

注釋中提到了 `std::cmp::PartialOrd`，這是一個 *trait*。下一部分會講到 trait。不過簡單來說，這個錯誤表明 `largest` 的函數體不能適用於 `T` 的所有可能的類型。因為在函數體需要比較 `T` 類型的值，不過它只能用於我們知道如何排序的類型。為了開啟比較功能，標準庫中定義的 `std::cmp::PartialOrd` trait 可以實現類型的比較功能（查看附錄 C 獲取該 trait 的更多訊息）。

標準庫中定義的 `std::cmp::PartialOrd` trait 可以實現類型的比較功能。在 [“trait 作為參數”][traits-as-parameters] 部分會講解如何指定泛型實現特定的 trait，不過讓我們先探索其他使用泛型參數的方法。

### 結構體定義中的泛型

同樣也可以用 `<>` 語法來定義結構體，它包含一個或多個泛型參數類型欄位。範例 10-6 展示了如何定義和使用一個可以存放任何類型的 `x` 和 `y` 坐標值的結構體 `Point`：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```

<span class="caption">範例 10-6：`Point` 結構體存放了兩個 `T` 類型的值 `x` 和 `y`</span>

其語法類似於函數定義中使用泛型。首先，必須在結構體名稱後面的角括號中聲明泛型參數的名稱。接著在結構體定義中可以指定具體數據類型的位置使用泛型類型。

注意 `Point<T>` 的定義中只使用了一個泛型類型，這個定義表明結構體 `Point<T>` 對於一些類型 `T` 是泛型的，而且欄位 `x` 和 `y` **都是** 相同類型的，無論它具體是何類型。如果嘗試創建一個有不同類型值的 `Point<T>` 的實例，像範例 10-7 中的代碼就不能編譯：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let wont_work = Point { x: 5, y: 4.0 };
}
```

<span class="caption">範例 10-7：欄位 `x` 和 `y` 的類型必須相同，因為他們都有相同的泛型類型 `T`</span>

在這個例子中，當把整型值 5 賦值給 `x` 時，就告訴了編譯器這個 `Point<T>` 實例中的泛型 `T` 是整型的。接著指定 `y` 為 4.0，它被定義為與 `x` 相同類型，就會得到一個像這樣的類型不匹配錯誤：

```text
error[E0308]: mismatched types
 --> src/main.rs:7:38
  |
7 |     let wont_work = Point { x: 5, y: 4.0 };
  |                                      ^^^ expected integer, found
floating-point number
  |
  = note: expected type `{integer}`
             found type `{float}`
```

如果想要定義一個 `x` 和 `y` 可以有不同類型且仍然是泛型的 `Point` 結構體，我們可以使用多個泛型類型參數。在範例 10-8 中，我們修改 `Point` 的定義為擁有兩個泛型類型 `T` 和 `U`。其中欄位 `x` 是 `T` 類型的，而欄位 `y` 是 `U` 類型的：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

<span class="caption">範例 10-8：使用兩個泛型的 `Point`，這樣 `x` 和 `y` 可能是不同類型</span>

現在所有這些 `Point` 實例都合法了！你可以在定義中使用任意多的泛型類型參數，不過太多的話，代碼將難以閱讀和理解。當你的代碼中需要許多泛型類型時，它可能表明你的代碼需要重構，分解成更小的結構。

### 枚舉定義中的泛型

和結構體類似，枚舉也可以在成員中存放泛型數據類型。第六章我們曾用過標準庫提供的 `Option<T>` 枚舉，這裡再回顧一下：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

現在這個定義應該更容易理解了。如你所見 `Option<T>` 是一個擁有泛型 `T` 的枚舉，它有兩個成員：`Some`，它存放了一個類型 `T` 的值，和不存在任何值的`None`。通過 `Option<T>` 枚舉可以表達有一個可能的值的抽象概念，同時因為 `Option<T>` 是泛型的，無論這個可能的值是什麼類型都可以使用這個抽象。

枚舉也可以擁有多個泛型類型。第九章使用過的 `Result` 枚舉定義就是一個這樣的例子：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` 枚舉有兩個泛型類型，`T` 和 `E`。`Result` 有兩個成員：`Ok`，它存放一個類型 `T` 的值，而 `Err` 則存放一個類型 `E` 的值。這個定義使得 `Result` 枚舉能很方便的表達任何可能成功（返回 `T` 類型的值）也可能失敗（返回 `E` 類型的值）的操作。實際上，這就是我們在範例 9-3 用來打開文件的方式：當成功打開文件的時候，`T` 對應的是 `std::fs::File` 類型；而當打開文件時出現問題時，`E` 的值則是 `std::io::Error` 類型。

當你意識到代碼中定義了多個結構體或枚舉，它們不一樣的地方只是其中的值的類型的時候，不妨透過泛型類型來避免重複。

### 方法定義中的泛型

在為結構體和枚舉實現方法時（像第五章那樣），一樣也可以用泛型。範例 10-9 中展示了範例 10-6 中定義的結構體 `Point<T>`，和在其上實現的名為 `x` 的方法。

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };

    println!("p.x = {}", p.x());
}
```

<span class="caption">範例 10-9：在 `Point<T>` 結構體上實現方法 `x`，它返回 `T` 類型的欄位 `x` 的引用</span>

這裡在 `Point<T>` 上定義了一個叫做 `x` 的方法來返回欄位 `x` 中數據的引用：

注意必須在 `impl` 後面聲明 `T`，這樣就可以在 `Point<T>` 上實現的方法中使用它了。在 `impl` 之後聲明泛型 `T` ，這樣 Rust 就知道 `Point` 的角括號中的類型是泛型而不是具體類型。

例如，可以選擇為 `Point<f32>` 實例實現方法，而不是為泛型 `Point` 實例。範例 10-10 展示了一個沒有在 `impl` 之後（的角括號）聲明泛型的例子，這裡使用了一個具體類型，`f32`：

```rust
# struct Point<T> {
#     x: T,
#     y: T,
# }
#
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

<span class="caption">範例 10-10：構建一個只用於擁有泛型參數 `T` 的結構體的具體類型的 `impl` 塊</span>

這段代碼意味著 `Point<f32>` 類型會有一個方法 `distance_from_origin`，而其他 `T` 不是 `f32` 類型的 `Point<T>` 實例則沒有定義此方法。這個方法計算點實例與坐標 (0.0, 0.0) 之間的距離，並使用了只能用於浮點型的數學運算符。

結構體定義中的泛型類型參數並不總是與結構體方法簽名中使用的泛型是同一類型。範例 10-11 中在範例 10-8 中的結構體 `Point<T, U>` 上定義了一個方法 `mixup`。這個方法獲取另一個 `Point` 作為參數，而它可能與調用 `mixup` 的 `self` 是不同的 `Point` 類型。這個方法用 `self` 的 `Point` 類型的 `x` 值（類型 `T`）和參數的 `Point` 類型的 `y` 值（類型 `W`）來創建一個新 `Point` 類型的實例：

<span class="filename">檔案名: src/main.rs</span>

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c'};

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

<span class="caption">範例 10-11：方法使用了與結構體定義中不同類型的泛型</span>

在 `main` 函數中，定義了一個有 `i32` 類型的 `x`（其值為 `5`）和 `f64` 的 `y`（其值為 `10.4`）的 `Point`。`p2` 則是一個有著字串 slice 類型的 `x`（其值為 `"Hello"`）和 `char` 類型的 `y`（其值為`c`）的 `Point`。在 `p1` 上以 `p2` 作為參數調用 `mixup` 會返回一個 `p3`，它會有一個 `i32` 類型的 `x`，因為 `x` 來自 `p1`，並擁有一個 `char` 類型的 `y`，因為 `y` 來自 `p2`。`println!` 會列印出 `p3.x = 5, p3.y = c`。

這個例子的目的是展示一些泛型通過 `impl` 聲明而另一些透過方法定義聲明的情況。這裡泛型參數 `T` 和 `U` 聲明於 `impl` 之後，因為他們與結構體定義相對應。而泛型參數 `V` 和 `W` 聲明於 `fn mixup` 之後，因為他們只是相對於方法本身的。

### 泛型代碼的性能

在閱讀本部分內容的同時，你可能會好奇使用泛型類型參數是否會有運行時消耗。好消息是：Rust 實現了泛型，使得使用泛型類型參數的代碼相比使用具體類型並沒有任何速度上的損失。

Rust 通過在編譯時進行泛型代碼的 **單態化**（*monomorphization*）來保證效率。單態化是一個透過填充編譯時使用的具體類型，將通用代碼轉換為特定代碼的過程。

編譯器所做的工作正好與範例 10-5 中我們創建泛型函數的步驟相反。編譯器尋找所有泛型代碼被調用的位置並使用泛型代碼針對具體類型生成代碼。

讓我們看看一個使用標準庫中 `Option` 枚舉的例子：

```rust
let integer = Some(5);
let float = Some(5.0);
```

當 Rust 編譯這些程式碼的時候，它會進行單態化。編譯器會讀取傳遞給 `Option<T>` 的值並發現有兩種 `Option<T>`：一個對應 `i32` 另一個對應 `f64`。為此，它會將泛型定義 `Option<T>` 展開為 `Option_i32` 和 `Option_f64`，接著將泛型定義替換為這兩個具體的定義。

編譯器生成的單態化版本的代碼看起來像這樣，並包含將泛型 `Option<T>` 替換為編譯器創建的具體定義後的用例代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

我們可以使用泛型來編寫不重複的代碼，而 Rust 將會為每一個實例編譯其特定類型的代碼。這意味著在使用泛型時沒有運行時開銷；當代碼運行，它的執行效率就跟好像手寫每個具體定義的重複代碼一樣。這個單態化過程正是 Rust 泛型在運行時極其高效的原因。

[traits-as-parameters]: ch10-02-traits.html#traits-as-parameters

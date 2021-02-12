## 使用`Box <T>`指向堆上的數據

> [ch15-01-box.md](https://github.com/rust-lang/book/blob/master/src/ch15-01-box.md) <br>
> commit a203290c640a378453261948b3fee4c4c6eb3d0f

最簡單直接的智慧指針是 _box_，其類型是 `Box<T>`。 box 允許你將一個值放在堆上而不是棧上。留在棧上的則是指向堆數據的指針。如果你想回顧一下棧與堆的區別請參考第四章。

除了數據被儲存在堆上而不是棧上之外，box 沒有性能損失。不過也沒有很多額外的功能。它們多用於如下場景：

- 當有一個在編譯時未知大小的類型，而又想要在需要確切大小的上下文中使用這個類型值的時候
- 當有大量數據並希望在確保數據不被拷貝的情況下轉移所有權的時候
- 當希望擁有一個值並只關心它的類型是否實現了特定 trait 而不是其具體類型的時候

我們會在 “box 允許創建遞迴類型” 部分展示第一種場景。在第二種情況中，轉移大量數據的所有權可能會花費很長的時間，因為數據在棧上進行了拷貝。為了改善這種情況下的性能，可以通過 box 將這些數據儲存在堆上。接著，只有少量的指針數據在棧上被拷貝。第三種情況被稱為 **trait 對象**（_trait object_），第十七章剛好有一整個部分 “為使用不同類型的值而設計的 trait 對象” 專門講解這個主題。所以這裡所學的內容會在第十七章再次用上！

### 使用 `Box<T>` 在堆上儲存數據

在討論 `Box<T>` 的用例之前，讓我們熟悉一下語法以及如何與儲存在 `Box<T>` 中的值進行交互。

範例 15-1 展示了如何使用 box 在堆上儲存一個 `i32`：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
}
```

<span class="caption">範例 15-1：使用 box 在堆上儲存一個 `i32` 值</span>

這裡定義了變數 `b`，其值是一個指向被分配在堆上的值 `5` 的 `Box`。這個程序會列印出 `b = 5`；在這個例子中，我們可以像數據是儲存在棧上的那樣訪問 box 中的數據。正如任何擁有數據所有權的值那樣，當像 `b` 這樣的 box 在 `main` 的末尾離開作用域時，它將被釋放。這個釋放過程作用於 box 本身（位於棧上）和它所指向的數據（位於堆上）。

將一個單獨的值存放在堆上並不是很有意義，所以像範例 15-1 這樣單獨使用 box 並不常見。將像單個 `i32` 這樣的值儲存在棧上，也就是其默認存放的地方在大部分使用場景中更為合適。讓我們看看一個不使用 box 時無法定義的類型的例子。

### Box 允許創建遞迴類型

Rust 需要在編譯時知道類型占用多少空間。一種無法在編譯時知道大小的類型是 **遞迴類型**（_recursive type_），其值的一部分可以是相同類型的另一個值。這種值的嵌套理論上可以無限的進行下去，所以 Rust 不知道遞迴類型需要多少空間。不過 box 有一個已知的大小，所以通過在循環類型定義中插入 box，就可以創建遞迴類型了。

讓我們探索一下 _cons list_，一個函數式程式語言中的常見類型，來展示這個（遞迴類型）概念。除了遞迴之外，我們將要定義的 cons list 類型是很直接的，所以這個例子中的概念，在任何遇到更為複雜的涉及到遞迴類型的場景時都很實用。

#### cons list 的更多內容

_cons list_ 是一個來源於 Lisp 程式語言及其方言的數據結構。在 Lisp 中，`cons` 函數（“construct function" 的縮寫）利用兩個參數來構造一個新的列表，他們通常是一個單獨的值和另一個列表。

cons 函數的概念涉及到更常見的函數式編程術語；“將 _x_ 與 _y_ 連接” 通常意味著構建一個新的容器而將 _x_ 的元素放在新容器的開頭，其後則是容器 _y_ 的元素。

cons list 的每一項都包含兩個元素：當前項的值和下一項。其最後一項值包含一個叫做 `Nil` 的值且沒有下一項。cons list 透過遞迴調用 `cons` 函數產生。代表遞迴的終止條件（base case）的規範名稱是 `Nil`，它宣布列表的終止。注意這不同於第六章中的 “null” 或 “nil” 的概念，他們代表無效或缺失的值。

注意雖然函數式程式語言經常使用 cons list，但是它並不是一個 Rust 中常見的類型。大部分在 Rust 中需要列表的時候，`Vec<T>` 是一個更好的選擇。其他更為複雜的遞迴數據類型 **確實** 在 Rust 的很多場景中很有用，不過通過以 cons list 作為開始，我們可以探索如何使用 box 毫不費力的定義一個遞迴數據類型。

範例 15-2 包含一個 cons list 的枚舉定義。注意這還不能編譯因為這個類型沒有已知的大小，之後我們會展示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
enum List {
    Cons(i32, List),
    Nil,
}
```

<span class="caption">範例 15-2：第一次嘗試定義一個代表 `i32` 值的 cons list 數據結構的枚舉</span>

> 注意：出於範例的需要我們選擇實現一個只存放 `i32` 值的 cons list。也可以用泛型，正如第十章講到的，來定義一個可以存放任何類型值的 cons list 類型。

使用這個 cons list 來儲存列表 `1, 2, 3` 將看起來如範例 15-3 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use crate::List::{Cons, Nil};

fn main() {
    let list = Cons(1, Cons(2, Cons(3, Nil)));
}
```

<span class="caption">範例 15-3：使用 `List` 枚舉儲存列表 `1, 2, 3`</span>

第一個 `Cons` 儲存了 `1` 和另一個 `List` 值。這個 `List` 是另一個包含 `2` 的 `Cons` 值和下一個 `List` 值。接著又有另一個存放了 `3` 的 `Cons` 值和最後一個值為 `Nil` 的 `List`，非遞迴成員代表了列表的結尾。

如果嘗試編譯範例 15-3 的代碼，會得到如範例 15-4 所示的錯誤：

```text
error[E0072]: recursive type `List` has infinite size
 --> src/main.rs:1:1
  |
1 | enum List {
  | ^^^^^^^^^ recursive type has infinite size
2 |     Cons(i32, List),
  |               ----- recursive without indirection
  |
  = help: insert indirection (e.g., a `Box`, `Rc`, or `&`) at some point to
  make `List` representable
```

<span class="caption">範例 15-4：嘗試定義一個遞迴枚舉時得到的錯誤</span>

這個錯誤表明這個類型 “有無限的大小”。其原因是 `List` 的一個成員被定義為是遞迴的：它直接存放了另一個相同類型的值。這意味著 Rust 無法計算為了存放 `List` 值到底需要多少空間。讓我們一點一點來看：首先了解一下 Rust 如何決定需要多少空間來存放一個非遞迴類型。

### 計算非遞迴類型的大小

回憶一下第六章討論枚舉定義時範例 6-2 中定義的 `Message` 枚舉：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

當 Rust 需要知道要為 `Message` 值分配多少空間時，它可以檢查每一個成員並發現 `Message::Quit` 並不需要任何空間，`Message::Move` 需要足夠儲存兩個 `i32` 值的空間，依此類推。因此，`Message` 值所需的空間等於儲存其最大成員的空間大小。

與此相對當 Rust 編譯器檢查像範例 15-2 中的 `List` 這樣的遞迴類型時會發生什麼事呢。編譯器嘗試計算出儲存一個 `List` 枚舉需要多少記憶體，並開始檢查 `Cons` 成員，那麼 `Cons` 需要的空間等於 `i32` 的大小加上 `List` 的大小。為了計算 `List` 需要多少記憶體，它檢查其成員，從 `Cons` 成員開始。`Cons`成員儲存了一個 `i32` 值和一個`List`值，這樣的計算將無限進行下去，如圖 15-1 所示：

<img alt="An infinite Cons list" src="img/trpl15-01.svg" class="center" style="width: 50%;" />

<span class="caption">圖 15-1：一個包含無限個 `Cons` 成員的無限 `List`</span>

### 使用 `Box<T>` 給遞迴類型一個已知的大小

Rust 無法計算出要為定義為遞迴的類型分配多少空間，所以編譯器給出了範例 15-4 中的錯誤。這個錯誤也包括了有用的建議：

```text
  = help: insert indirection (e.g., a `Box`, `Rc`, or `&`) at some point to
  make `List` representable
```

在建議中，“indirection” 意味著不同於直接儲存一個值，我們將間接的儲存一個指向值的指針。

因為 `Box<T>` 是一個指針，我們總是知道它需要多少空間：指針的大小並不會根據其指向的數據量而改變。這意味著可以將 `Box` 放入 `Cons` 成員中而不是直接存放另一個 `List` 值。`Box` 會指向另一個位於堆上的 `List` 值，而不是存放在 `Cons` 成員中。從概念上講，我們仍然有一個通過在其中 “存放” 其他列表創建的列表，不過現在實現這個概念的方式更像是一個項挨著另一項，而不是一項包含另一項。

我們可以修改範例 15-2 中 `List` 枚舉的定義和範例 15-3 中對 `List` 的應用，如範例 15-65 所示，這是可以編譯的：

<span class="filename">檔案名: src/main.rs</span>

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use crate::List::{Cons, Nil};

fn main() {
    let list = Cons(1,
        Box::new(Cons(2,
            Box::new(Cons(3,
                Box::new(Nil))))));
}
```

<span class="caption">範例 15-5：為了擁有已知大小而使用 `Box<T>` 的 `List` 定義</span>

`Cons` 成員將會需要一個 `i32` 的大小加上儲存 box 指針數據的空間。`Nil` 成員不儲存值，所以它比 `Cons` 成員需要更少的空間。現在我們知道了任何 `List` 值最多需要一個 `i32` 加上 box 指針數據的大小。透過使用 box ，打破了這無限遞迴的連鎖，這樣編譯器就能夠計算出儲存 `List` 值需要的大小了。圖 15-2 展示了現在 `Cons` 成員看起來像什麼：

<img alt="A finite Cons list" src="img/trpl15-02.svg" class="center" />

<span class="caption">圖 15-2：因為 `Cons` 存放一個 `Box` 所以 `List` 不是無限大小的了</span>

box 只提供了間接存儲和堆分配；他們並沒有任何其他特殊的功能，比如我們將會見到的其他智慧指針。它們也沒有這些特殊功能帶來的性能損失，所以他們可以用於像 cons list 這樣間接存儲是唯一所需功能的場景。我們還將在第十七章看到 box 的更多應用場景。

`Box<T>` 類型是一個智慧指針，因為它實現了 `Deref` trait，它允許 `Box<T>` 值被當作引用對待。當 `Box<T>` 值離開作用域時，由於 `Box<T>` 類型 `Drop` trait 的實現，box 所指向的堆數據也會被清除。讓我們更詳細的探索一下這兩個 trait。這兩個 trait 對於在本章餘下討論的其他智慧指針所提供的功能中，將會更為重要。

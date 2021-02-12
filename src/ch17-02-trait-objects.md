## 為使用不同類型的值而設計的 trait 對象

> [ch17-02-trait-objects.md](https://github.com/rust-lang/book/blob/master/src/ch17-02-trait-objects.md)
> <br>
> commit 7b23a000fc511d985069601eb5b09c6017e609eb

 在第八章中，我們談到了 vector 只能存儲同種類型元素的局限。範例 8-10 中提供了一個定義 `SpreadsheetCell` 枚舉來儲存整型，浮點型和文本成員的替代方案。這意味著可以在每個單元中儲存不同類型的數據，並仍能擁有一個代表一排單元的 vector。這在當編譯代碼時就知道希望可以交替使用的類型為固定集合的情況下是完全可行的。

然而有時我們希望庫用戶在特定情況下能夠擴展有效的類型集合。為了展示如何實現這一點，這裡將創建一個圖形用戶介面（Graphical User Interface， GUI）工具的例子，它透過遍歷列表並調用每一個項目的 `draw` 方法來將其繪製到螢幕上 —— 此乃一個 GUI 工具的常見技術。我們將要創建一個叫做 `gui` 的庫 crate，它含一個 GUI 庫的結構。這個 GUI 庫包含一些可供開發者使用的類型，比如 `Button` 或 `TextField`。在此之上，`gui` 的用戶希望創建自訂的可以繪製於螢幕上的類型：比如，一個程式設計師可能會增加 `Image`，另一個可能會增加 `SelectBox`。

這個例子中並不會實現一個功能完善的 GUI 庫，不過會展示其中各個部分是如何結合在一起的。編寫庫的時候，我們不可能知曉並定義所有其他程式設計師希望創建的類型。我們所知曉的是 `gui` 需要記錄一系列不同類型的值，並需要能夠對其中每一個值調用 `draw` 方法。這裡無需知道調用 `draw` 方法時具體會發生什麼事，只要該值會有那個方法可供我們調用。

在擁有繼承的語言中，可以定義一個名為 `Component` 的類，該類上有一個 `draw` 方法。其他的類比如 `Button`、`Image` 和 `SelectBox` 會從 `Component` 派生並因此繼承 `draw` 方法。它們各自都可以覆蓋 `draw` 方法來定義自己的行為，但是框架會把所有這些類型當作是 `Component` 的實例，並在其上調用 `draw`。不過 Rust 並沒有繼承，我們得另尋出路。

### 定義通用行為的 trait

為了實現 `gui` 所期望的行為，讓我們定義一個 `Draw` trait，其中包含名為 `draw` 的方法。接著可以定義一個存放 **trait 對象**（*trait object*） 的 vector。trait 對象指向一個實現了我們指定 trait 的類型的實例，以及一個用於在運行時查找該類型的trait方法的表。我們透過指定某種指針來創建 trait 對象，例如 `&` 引用或  `Box<T>` 智慧指針，還有 `dyn`  keyword， 以及指定相關的 trait（第十九章  [““動態大小類型和 `Sized` trait”][dynamically-sized] 部分會介紹 trait 對象必須使用指針的原因）。我們可以使用 trait 對象代替泛型或具體類型。任何使用 trait 對象的位置，Rust 的類型系統會在編譯時確保任何在此上下文中使用的值會實現其 trait 對象的 trait。如此便無需在編譯時就知曉所有可能的類型。

之前提到過，Rust 刻意不將結構體與枚舉稱為 “對象”，以便與其他語言中的對象相區別。在結構體或枚舉中，結構體欄位中的數據和 `impl` 塊中的行為是分開的，不同於其他語言中將數據和行為組合進一個稱為對象的概念中。trait 對象將數據和行為兩者相結合，從這種意義上說 **則** 其更類似其他語言中的對象。不過 trait 對象不同於傳統的對象，因為不能向 trait 對象增加數據。trait 對象並不像其他語言中的對象那麼通用：其（trait 對象）具體的作用是允許對通用行為進行抽象。

範例 17-3 展示了如何定義一個帶有 `draw` 方法的 trait `Draw`：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub trait Draw {
    fn draw(&self);
}
```

<span class="caption">範例 17-3：`Draw` trait 的定義</span>

因為第十章已經討論過如何定義 trait，其語法看起來應該比較眼熟。接下來就是新內容了：範例 17-4 定義了一個存放了名叫 `components` 的 vector 的結構體 `Screen`。這個 vector 的類型是 `Box<dyn Draw>`，此為一個 trait 對象：它是 `Box` 中任何實現了 `Draw` trait 的類型的替身。

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Draw {
#     fn draw(&self);
# }
#
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,
}
```

<span class="caption">範例 17-4: 一個 `Screen` 結構體的定義，它帶有一個欄位 `components`，其包含實現了 `Draw` trait 的 trait 對象的 vector</span>

在 `Screen` 結構體上，我們將定義一個 `run` 方法，該方法會對其 `components` 上的每一個組件調用 `draw` 方法，如範例 17-5 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Draw {
#     fn draw(&self);
# }
#
# pub struct Screen {
#     pub components: Vec<Box<dyn Draw>>,
# }
#
impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

<span class="caption">範例 17-5：在 `Screen` 上實現一個 `run` 方法，該方法在每個 component 上調用 `draw` 方法</span>

這與定義使用了帶有 trait bound 的泛型類型參數的結構體不同。泛型類型參數一次只能替代一個具體類型，而 trait 對象則允許在運行時替代多種具體類型。例如，可以定義 `Screen` 結構體來使用泛型和 trait bound，如範例 17-6 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Draw {
#     fn draw(&self);
# }
#
pub struct Screen<T: Draw> {
    pub components: Vec<T>,
}

impl<T> Screen<T>
    where T: Draw {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

<span class="caption">範例 17-6: 一種 `Screen` 結構體的替代實現，其 `run` 方法使用泛型和 trait bound</span>

這限制了 `Screen` 實例必須擁有一個全是 `Button` 類型或者全是 `TextField` 類型的組件列表。如果只需要同質（相同類型）集合，則傾向於使用泛型和 trait bound，因為其定義會在編譯時採用具體類型進行單態化。

另一方面，透過使用 trait 對象的方法，一個 `Screen` 實例可以存放一個既能包含 `Box<Button>`，也能包含 `Box<TextField>` 的 `Vec<T>`。讓我們看看它是如何工作的，接著會講到其運行時性能影響。

### 實現 trait

現在來增加一些實現了 `Draw` trait 的類型。我們將提供 `Button` 類型。再一次重申，真正實現 GUI 庫超出了本書的範疇，所以 `draw` 方法體中不會有任何有意義的實現。為了想像一下這個實現看起來像什麼，一個 `Button` 結構體可能會擁有 `width`、`height` 和 `label` 欄位，如範例 17-7 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Draw {
#     fn draw(&self);
# }
#
pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        // 實際繪製按鈕的代碼
    }
}
```

<span class="caption">範例 17-7: 一個實現了 `Draw` trait 的 `Button` 結構體</span>

在 `Button` 上的 `width`、`height` 和 `label` 欄位會和其他組件不同，比如 `TextField` 可能有 `width`、`height`、`label` 以及 `placeholder` 欄位。每一個我們希望能在螢幕上繪製的類型都會使用不同的代碼來實現 `Draw` trait 的 `draw` 方法來定義如何繪製特定的類型，像這裡的 `Button` 類型（並不包含任何實際的 GUI 代碼，這超出了本章的範疇）。除了實現 `Draw` trait 之外，比如 `Button` 還可能有另一個包含按鈕點擊如何響應的方法的 `impl` 塊。這類方法並不適用於像 `TextField` 這樣的類型。

如果一些庫的使用者決定實現一個包含 `width`、`height` 和 `options` 欄位的結構體 `SelectBox`，並且也為其實現了 `Draw` trait，如範例 17-8 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use gui::Draw;

struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        // code to actually draw a select box
    }
}
```

<span class="caption">範例 17-8: 另一個使用 `gui` 的 crate 中，在 `SelectBox` 結構體上實現 `Draw` trait</span>

庫使用者現在可以在他們的 `main` 函數中創建一個 `Screen` 實例。至此可以透過將 `SelectBox` 和 `Button` 放入 `Box<T>` 轉變為 trait 對象來增加組件。接著可以調用 `Screen` 的 `run` 方法，它會調用每個組件的 `draw` 方法。範例 17-9 展示了這個實現：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use gui::{Screen, Button};

fn main() {
    let screen = Screen {
        components: vec![
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("Yes"),
                    String::from("Maybe"),
                    String::from("No")
                ],
            }),
            Box::new(Button {
                width: 50,
                height: 10,
                label: String::from("OK"),
            }),
        ],
    };

    screen.run();
}
```

<span class="caption">範例 17-9: 使用 trait 對象來存儲實現了相同 trait 的不同類型的值</span>

當編寫庫的時候，我們不知道何人會在何時增加 `SelectBox` 類型，不過 `Screen` 的實現能夠操作並繪製這個新類型，因為 `SelectBox` 實現了 `Draw` trait，這意味著它實現了 `draw` 方法。

這個概念 —— 只關心值所反映的訊息而不是其具體類型 —— 類似於動態類型語言中稱為 **鴨子類型**（*duck typing*）的概念：如果它走起來像一隻鴨子，叫起來像一隻鴨子，那麼它就是一隻鴨子！在範例 17-5 中 `Screen` 上的 `run` 實現中，`run` 並不需要知道各個組件的具體類型是什麼。它並不檢查組件是 `Button` 或者 `SelectBox` 的實例。通過指定 `Box<dyn Draw>` 作為 `components` vector 中值的類型，我們就定義了 `Screen` 為需要可以在其上調用 `draw` 方法的值。

使用 trait 對象和 Rust 類型系統來進行類似鴨子類型操作的優勢是無需在運行時檢查一個值是否實現了特定方法或者擔心在調用時因為值沒有實現方法而產生錯誤。如果值沒有實現 trait 對象所需的 trait 則 Rust 不會編譯這些程式碼。

例如，範例 17-10 展示了當創建一個使用 `String` 做為其組件的 `Screen` 時發生的情況：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
use gui::Screen;

fn main() {
    let screen = Screen {
        components: vec![
            Box::new(String::from("Hi")),
        ],
    };

    screen.run();
}
```

<span class="caption">範例 17-10: 嘗試使用一種沒有實現 trait 對象的 trait 的類型</span>

我們會遇到這個錯誤，因為 `String` 沒有實現 `rust_gui::Draw` trait：

```text
error[E0277]: the trait bound `std::string::String: gui::Draw` is not satisfied
  --> src/main.rs:7:13
   |
 7 |             Box::new(String::from("Hi")),
   |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait gui::Draw is not
   implemented for `std::string::String`
   |
   = note: required for the cast to the object type `gui::Draw`
```

這告訴了我們，要嘛是我們傳遞了並不希望傳遞給 `Screen` 的類型並應該提供其他類型，要嘛應該在 `String` 上實現 `Draw` 以便 `Screen` 可以調用其上的 `draw`。

### trait 對象執行動態分發

回憶一下第十章 [“泛型代碼的性能”][performance-of-code-using-generics] 部分討論過的，當對泛型使用 trait bound 時編譯器所進行單態化處理：編譯器為每一個被泛型類型參數代替的具體類型生成了非泛型的函數和方法實現。單態化所產生的代碼進行 **靜態分發**（*static dispatch*）。靜態分發發生於編譯器在編譯時就知曉調用了什麼方法的時候。這與 **動態分發** （*dynamic dispatch*）相對，這時編譯器在編譯時無法知曉調用了什麼方法。在動態分發的情況下，編譯器會生成在運行時確定調用了什麼方法的代碼。

當使用 trait 對象時，Rust 必須使用動態分發。編譯器無法知曉所有可能用於 trait 對象代碼的類型，所以它也不知道應該調用哪個類型的哪個方法實現。為此，Rust 在運行時使用 trait 對象中的指針來知曉需要調用哪個方法。動態分發也阻止編譯器有選擇的內聯方法代碼，這會相應的禁用一些最佳化。儘管在編寫範例 17-5 和可以支持範例 17-9 中的代碼的過程中確實獲得了額外的靈活性，但仍然需要權衡取捨。

### Trait 對象要求對象安全

只有 **對象安全**（*object safe*）的 trait 才可以組成 trait 對象。圍繞所有使得 trait 對象安全的屬性存在一些複雜的規則，不過在實踐中，只涉及到兩條規則。如果一個 trait 中所有的方法有如下屬性時，則該 trait 是對象安全的：

- 返回值類型不為 `Self`
- 方法沒有任何泛型類型參數

`Self` 關鍵字是我們要實現 trait 或方法的類型的別名。對象安全對於 trait 對象是必須的，因為一旦有了 trait 對象，就不再知曉實現該 trait 的具體類型是什麼了。如果 trait 方法返回具體的 `Self` 類型，但是 trait 對象忘記了其真正的類型，那麼方法不可能使用已經忘卻的原始具體類型。同理對於泛型類型參數來說，當使用 trait 時其會放入具體的類型參數：此具體類型變成了實現該 trait 的類型的一部分。當使用 trait 對象時其具體類型被抹去了，故無從得知放入泛型參數類型的類型是什麼。

一個 trait 的方法不是對象安全的例子是標準庫中的 `Clone` trait。`Clone` trait 的 `clone` 方法的參數簽名看起來像這樣：

```rust
pub trait Clone {
    fn clone(&self) -> Self;
}
```

`String` 實現了 `Clone` trait，當在 `String` 實例上調用 `clone` 方法時會得到一個 `String` 實例。類似的，當調用 `Vec<T>` 實例的 `clone` 方法會得到一個 `Vec<T>` 實例。`clone` 的簽名需要知道什麼類型會代替 `Self`，因為這是它的返回值。

如果嘗試做一些違反有關 trait 對象的對象安全規則的事情，編譯器會提示你。例如，如果嘗試實現範例 17-4 中的 `Screen` 結構體來存放實現了 `Clone` trait 而不是 `Draw` trait 的類型，像這樣：

```rust,ignore,does_not_compile
pub struct Screen {
    pub components: Vec<Box<dyn Clone>>,
}
```

將會得到如下錯誤：

```text
error[E0038]: the trait `std::clone::Clone` cannot be made into an object
 --> src/lib.rs:2:5
  |
2 |     pub components: Vec<Box<dyn Clone>>,
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait `std::clone::Clone`
  cannot be made into an object
  |
  = note: the trait cannot require that `Self : Sized`
```

這意味著不能以這種方式使用此 trait 作為 trait 對象。如果你對對象安全的更多細節感興趣，請查看 [Rust RFC 255]。

[Rust RFC 255]: https://github.com/rust-lang/rfcs/blob/master/text/0255-object-safety.md

[performance-of-code-using-generics]:
ch10-01-syntax.html#performance-of-code-using-generics
[dynamically-sized]: ch19-04-advanced-types.html#dynamically-sized-types-and-the-sized-trait

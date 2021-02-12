## 宏

> [ch19-06-macros.md](https://github.com/rust-lang/book/blob/master/src/ch19-06-macros.md)
> <br>
> commit 7ddc46460f09a5cd9bd2a620565bdc20b3315ea9

我們已經在本書中使用過像 `println!` 這樣的宏了，不過還沒完全探索什麼是宏以及它是如何工作的。**宏**（*Macro*）指的是 Rust 中一系列的功能：**聲明**（*Declarative*）宏，使用 `macro_rules!`，和三種 **過程**（*Procedural*）宏：

* 自訂 `#[derive]` 宏在結構體和枚舉上指定通過 `derive` 屬性添加的代碼
* 類屬性（Attribute-like）宏定義可用於任意項的自訂屬性
* 類函數宏看起來像函數不過作用於作為參數傳遞的 token。

我們會依次討論每一種宏，不過首要的是，為什麼已經有了函數還需要宏呢？

### 宏和函數的區別

從根本上來說，宏是一種為寫其他代碼而寫程式碼的方式，即所謂的 **元編程**（*metaprogramming*）。在附錄 C 中會探討 `derive` 屬性，其生成各種 trait 的實現。我們也在本書中使用過 `println!` 宏和 `vec!` 宏。所有的這些宏以 **展開** 的方式來生成比你所手寫出的更多的代碼。

元編程對於減少大量編寫和維護的代碼是非常有用的，它也扮演了函數扮演的角色。但宏有一些函數所沒有的附加能力。

一個函數標籤必須聲明函數參數個數和類型。相比之下，宏能夠接受不同數量的參數：用一個參數調用 `println!("hello")` 或用兩個參數調用 `println!("hello {}", name)` 。而且，宏可以在編譯器翻譯代碼前展開，例如，宏可以在一個給定類型上實現 trait 。而函數則不行，因為函數是在運行時被調用，同時 trait 需要在編譯時實現。

實現一個宏而不是函數的消極面是宏定義要比函數定義更複雜，因為你正在編寫生成 Rust 代碼的 Rust 代碼。由於這樣的間接性，宏定義通常要比函數定義更難閱讀、理解以及維護。

宏和函數的最後一個重要的區別是：在一個文件裡調用宏 **之前** 必須定義它，或將其引入作用域，而函數則可以在任何地方定義和調用。

### 使用 `macro_rules!` 的聲明宏用於通用元編程

Rust 最常用的宏形式是 **聲明宏**（*declarative macros*）。它們有時也被稱為 “macros by example”、“`macro_rules!` 宏” 或者就是 “macros”。其核心概念是，聲明宏允許我們編寫一些類似 Rust `match` 表達式的代碼。正如在第六章討論的那樣，`match` 表達式是控制結構，其接收一個表達式，與表達式的結果進行模式匹配，然後根據模式匹配執行相關代碼。宏也將一個值和包含相關代碼的模式進行比較；此種情況下，該值是傳遞給宏的 Rust 原始碼字面值，模式用於和傳遞給宏的原始碼進行比較，同時每個模式的相關代碼則用於替換傳遞給宏的代碼。所有這一切都發生於編譯時。

可以使用 `macro_rules!` 來定義宏。讓我們通過查看 `vec!` 宏定義來探索如何使用 `macro_rules!` 結構。第八章講述了如何使用 `vec!` 宏來生成一個給定值的 vector。例如，下面的宏用三個整數創建一個 vector：

```rust
let v: Vec<u32> = vec![1, 2, 3];
```

也可以使用 `vec!` 宏來構造兩個整數的 vector 或五個字串 slice 的 vector 。但卻無法使用函數做相同的事情，因為我們無法預先知道參數值的數量和類型。

在範例 19-28 中展示了一個 `vec!` 稍微簡化的定義。

<span class="filename">檔案名: src/lib.rs</span>

```rust
#[macro_export]
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

<span class="caption">範例 19-28: 一個 `vec!` 宏定義的簡化版本</span>

> 注意：標準庫中實際定義的 `vec!` 包括預分配適當量的記憶體的代碼。這部分為代碼最佳化，為了讓範例簡化，此處並沒有包含在內。


無論何時導入定義了宏的包，`#[macro_export]` 註解說明宏應該是可用的。 如果沒有該註解，這個宏不能被引入作用域。

接著使用 `macro_rules!` 和宏名稱開始宏定義，且所定義的宏並 **不帶** 驚嘆號。名字後跟大括號表示宏定義體，在該例中宏名稱是 `vec` 。

`vec!` 宏的結構和 `match` 表達式的結構類似。此處有一個單邊模式 `( $( $x:expr ),* )` ，後跟 `=>` 以及和模式相關的代碼塊。如果模式匹配，該相關代碼塊將被執行。假設這是這個宏中唯一的模式，則只有這一種有效匹配，其他任何匹配都是錯誤的。更複雜的宏會有多個單邊模式。

宏定義中有效模式語法和在第十八章提及的模式語法是不同的，因為宏模式所匹配的是 Rust 代碼結構而不是值。回過頭來檢查一下範例 19-28 中模式片段什麼意思。對於全部的宏模式語法，請查閱[參考]。

[參考]: https://doc.rust-lang.org/reference/macros.html

首先，一對括號包含了整個模式。接下來是美元符號（ `$` ），後跟一對括號，捕獲了符合括號內模式的值以用於替換後的代碼。`$()` 內則是 `$x:expr` ，其匹配 Rust 的任意表達式，並將該表達式記作 `$x`。

`$()` 之後的逗號說明一個可有可無的逗號分隔符可以出現在 `$()` 所匹配的代碼之後。緊隨逗號之後的 `*` 說明該模式匹配零個或更多個 `*` 之前的任何模式。

當以 `vec![1, 2, 3];` 調用宏時，`$x` 模式與三個表達式 `1`、`2` 和 `3` 進行了三次匹配。

現在讓我們來看看與此單邊模式相關聯的代碼塊中的模式：對於每個（在 `=>` 前面）匹配模式中的 `$()` 的部分，生成零個或更多個（在 `=>` 後面）位於 `$()*` 內的 `temp_vec.push()` ，生成的個數取決於該模式被匹配的次數。`$x` 由每個與之相匹配的表達式所替換。當以 `vec![1, 2, 3];` 調用該宏時，替換該宏調用所生成的代碼會是下面這樣：

```rust,ignore
let mut temp_vec = Vec::new();
temp_vec.push(1);
temp_vec.push(2);
temp_vec.push(3);
temp_vec
```

我們已經定義了一個宏，其可以接收任意數量和類型的參數，同時可以生成能夠創建包含指定元素的 vector 的代碼。

`macro_rules!` 中有一些奇怪的地方。在將來，會有第二種採用 `macro` 關鍵字的聲明宏，其工作方式類似但修復了這些極端情況。在此之後，`macro_rules!` 實際上就過時（deprecated）了。在此基礎之上，同時鑑於大多數 Rust 程式設計師 **使用** 宏而非 **編寫** 宏的事實，此處不再深入探討 `macro_rules!`。請查閱線上文件或其他資源，如 [“The Little Book of Rust Macros”][tlborm] 來更多地了解如何寫宏。

[tlborm]: https://danielkeep.github.io/tlborm/book/index.html

### 用於從屬性生成代碼的過程宏

第二種形式的宏被稱為 **過程宏**（*procedural macros*），因為它們更像函數（一種過程類型）。過程宏接收 Rust 代碼作為輸入，在這些程式碼上進行操作，然後產生另一些程式碼作為輸出，而非像聲明式宏那樣匹配對應模式然後以另一部分代碼替換當前代碼。

有三種類型的過程宏（自訂派生（derive），類屬性和類函數），不過它們的工作方式都類似。

當創建過程宏時，其定義必須位於一種特殊類型的屬於它們自己的 crate 中。這麼做出於複雜的技術原因，將來我們希望能夠消除這些限制。使用這些宏需採用類似範例 19-29 所示的代碼形式，其中 `some_attribute` 是一個使用特定宏的占位符。

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore
use proc_macro;

#[some_attribute]
pub fn some_name(input: TokenStream) -> TokenStream {
}
```

<span class="caption">範例 19-29: 一個使用過程宏的例子</span>

過程宏包含一個函數，這也是其得名的原因：“過程” 是 “函數” 的同義詞。那麼為何不叫 “函數宏” 呢？好吧，有一個過程宏是 “類函數” 的，叫成函數會產生混亂。無論如何，定義過程宏的函數接受一個 `TokenStream` 作為輸入並產生一個 `TokenStream` 作為輸出。這也就是宏的核心：宏所處理的原始碼組成了輸入 `TokenStream`，同時宏生成的代碼是輸出 `TokenStream`。最後，函數上有一個屬性；這個屬性表明過程宏的類型。在同一 crate 中可以有多種的過程宏。

考慮到這些宏是如此類似，我們會從自訂派生宏開始。接著會解釋與其他形式宏的微小區別。

### 如何編寫自訂 `derive` 宏

讓我們創建一個 `hello_macro` crate，其包含名為 `HelloMacro` 的 trait 和關聯函數 `hello_macro`。不同於讓 crate 的用戶為其每一個類型實現 `HelloMacro` trait，我們將會提供一個過程式宏以便用戶可以使用 `#[derive(HelloMacro)]` 註解他們的類型來得到 `hello_macro` 函數的默認實現。該默認實現會列印 `Hello, Macro! My name is TypeName!`，其中 `TypeName` 為定義了 trait 的類型名。換言之，我們會創建一個 crate，使程式設計師能夠寫類似範例 19-30 中的代碼。

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
use hello_macro::HelloMacro;
use hello_macro_derive::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();
}
```

<span class="caption">範例 19-30: crate 用戶所寫的能夠使用過程式宏的代碼</span>

運行該代碼將會列印 `Hello, Macro! My name is Pancakes!` 第一步是像下面這樣新建一個庫 crate：

```text
$ cargo new hello_macro --lib
```

接下來，會定義 `HelloMacro` trait 以及其關聯函數：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub trait HelloMacro {
    fn hello_macro();
}
```

現在有了一個包含函數的 trait 。此時，crate 用戶可以實現該 trait 以達到其期望的功能，像這樣：

```rust,ignore
use hello_macro::HelloMacro;

struct Pancakes;

impl HelloMacro for Pancakes {
    fn hello_macro() {
        println!("Hello, Macro! My name is Pancakes!");
    }
}

fn main() {
    Pancakes::hello_macro();
}
```

然而，他們需要為每一個他們想使用 `hello_macro` 的類型編寫實現的代碼塊。我們希望為其節約這些工作。

另外，我們也無法為 `hello_macro` 函數提供一個能夠列印實現了該 trait 的類型的名字的默認實現：Rust 沒有反射的能力，因此其無法在運行時獲取類型名。我們需要一個在編譯時生成代碼的宏。

下一步是定義過程式宏。在編寫本部分時，過程式宏必須在其自己的 crate 內。該限制最終可能被取消。構造 crate 和其中宏的慣例如下：對於一個 `foo` 的包來說，一個自訂的派生過程宏的包被稱為 `foo_derive` 。在 `hello_macro` 項目中新建名為 `hello_macro_derive` 的包。

```text
$ cargo new hello_macro_derive --lib
```

由於兩個 crate 緊密相關，因此在 `hello_macro` 包的目錄下創建過程式宏的 crate。如果改變在 `hello_macro` 中定義的 trait ，同時也必須改變在 `hello_macro_derive` 中實現的過程式宏。這兩個包需要分別發布，編程人員如果使用這些包，則需要同時添加這兩個依賴並將其引入作用域。我們也可以只用 `hello_macro` 包而將 `hello_macro_derive` 作為一個依賴，並重新導出過程式宏的代碼。但現在我們組織項目的方式使編程人員在無需 `derive` 功能時也能夠單獨使用 `hello_macro`。

需要將 `hello_macro_derive` 聲明為一個過程宏的 crate。同時也需要 `syn` 和 `quote` crate 中的功能，正如注釋中所說，需要將其加到依賴中。為 `hello_macro_derive` 將下面的代碼加入到 *Cargo.toml* 文件中。

<span class="filename">檔案名: hello_macro_derive/Cargo.toml</span>

```toml
[lib]
proc-macro = true

[dependencies]
syn = "0.14.4"
quote = "0.6.3"
```

為定義一個過程式宏，請將範例 19-31 中的代碼放在 `hello_macro_derive` crate 的 *src/lib.rs* 文件裡面。注意這段代碼在我們添加 `impl_hello_macro` 函數的定義之前是無法編譯的。

<span class="filename">檔案名: hello_macro_derive/src/lib.rs</span>

<!--
This usage of `extern crate` is required for the moment with 1.31.0, see:
https://github.com/rust-lang/rust/issues/54418
https://github.com/rust-lang/rust/pull/54658
https://github.com/rust-lang/rust/issues/55599
-->

> 在 Rust 1.31.0 時，`extern crate` 仍是必須的，請查看 <br />
> https://github.com/rust-lang/rust/issues/54418 <br />
> https://github.com/rust-lang/rust/pull/54658 <br />
> https://github.com/rust-lang/rust/issues/55599

```rust,ignore
extern crate proc_macro;

use crate::proc_macro::TokenStream;
use quote::quote;
use syn;

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    // 構建 Rust 代碼所代表的語法樹
    // 以便可以進行操作
    let ast = syn::parse(input).unwrap();

    // 構建 trait 實現
    impl_hello_macro(&ast)
}
```

<span class="caption">範例 19-31: 大多數過程式宏處理 Rust 代碼時所需的代碼</span>

注意 `hello_macro_derive` 函數中代碼分割的方式，它負責解析 `TokenStream`，而 `impl_hello_macro` 函數則負責轉換語法樹：這讓編寫一個過程式宏更加方便。外部函數中的代碼（在這裡是 `hello_macro_derive`）幾乎在所有你能看到或創建的過程宏 crate 中都一樣。內部函數（在這裡是 `impl_hello_macro`）的函數體中所指定的代碼則依過程宏的目的而各有不同。

現在，我們已經引入了三個新的 crate：`proc_macro` 、 [`syn`] 和 [`quote`] 。Rust 自帶 `proc_macro` crate，因此無需將其加到 *Cargo.toml* 文件的依賴中。`proc_macro` crate 是編譯器用來讀取和操作我們 Rust 代碼的 API。

[`syn`]: https://crates.io/crates/syn
[`quote`]: https://crates.io/crates/quote

`syn` crate 將字串中的 Rust 代碼解析成為一個可以操作的數據結構。`quote` 則將 `syn` 解析的數據結構轉換回 Rust 代碼。這些 crate 讓解析任何我們所要處理的 Rust 代碼變得更簡單：為 Rust 編寫整個的解析器並不是一件簡單的工作。

當用戶在一個類型上指定 `#[derive(HelloMacro)]` 時，`hello_macro_derive`  函數將會被調用。原因在於我們已經使用 `proc_macro_derive` 及其指定名稱對 `hello_macro_derive` 函數進行了註解：`HelloMacro` ，其匹配到 trait 名，這是大多數過程宏遵循的習慣。

該函數首先將來自 `TokenStream` 的 `input` 轉換為一個我們可以解釋和操作的數據結構。這正是 `syn` 派上用場的地方。`syn` 中的 `parse_derive_input` 函數獲取一個 `TokenStream` 並返回一個表示解析出 Rust 代碼的 `DeriveInput` 結構體。範例 19-32 展示了從字串 `struct Pancakes;` 中解析出來的 `DeriveInput` 結構體的相關部分：

```rust,ignore
DeriveInput {
    // --snip--

    ident: Ident {
        ident: "Pancakes",
        span: #0 bytes(95..103)
    },
    data: Struct(
        DataStruct {
            struct_token: Struct,
            fields: Unit,
            semi_token: Some(
                Semi
            )
        }
    )
}
```

<span class="caption">範例 19-32: 解析範例 19-30 中帶有宏屬性的代碼時得到的 `DeriveInput` 實例</span>

該結構體的欄位展示了我們解析的 Rust 代碼是一個類單元結構體，其 `ident`（ identifier，表示名字）為 `Pancakes`。該結構體裡面有更多欄位描述了所有類型的 Rust 代碼，查閱 [`syn` 中 `DeriveInput` 的文件][syn-docs] 以獲取更多訊息。

[syn-docs]: https://docs.rs/syn/0.14.4/syn/struct.DeriveInput.html

此時，尚未定義 `impl_hello_macro` 函數，其用於構建所要包含在內的 Rust 新代碼。但在此之前，注意其輸出也是 `TokenStream`。所返回的 `TokenStream` 會被加到我們的 crate 用戶所寫的代碼中，因此，當用戶編譯他們的 crate 時，他們會獲取到我們所提供的額外功能。

你可能也注意到了，當調用 `syn::parse` 函數失敗時，我們用 `unwrap` 來使 `hello_macro_derive` 函數 panic。在錯誤時 panic 對過程宏來說是必須的，因為 `proc_macro_derive` 函數必須返回 `TokenStream` 而不是 `Result`，以此來符合過程宏的 API。這裡選擇用 `unwrap` 來簡化了這個例子；在生產代碼中，則應該通過 `panic!` 或 `expect` 來提供關於發生何種錯誤的更加明確的錯誤訊息。

現在我們有了將註解的 Rust 代碼從 `TokenStream` 轉換為 `DeriveInput` 實例的代碼，讓我們來創建在註解類型上實現 `HelloMacro` trait 的代碼，如範例 19-33 所示。

<span class="filename">檔案名: hello_macro_derive/src/lib.rs</span>

```rust,ignore
fn impl_hello_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}", stringify!(#name));
            }
        }
    };
    gen.into()
}
```

<span class="caption">範例 19-33: 使用解析過的 Rust 代碼實現 `HelloMacro` trait</span>

我們得到一個包含以 `ast.ident` 作為註解類型名字（標識符）的 `Ident` 結構體實例。範例 19-32 中的結構體表明當 `impl_hello_macro` 函數運行於範例 19-30 中的代碼上時 `ident` 欄位的值是 `"Pancakes"`。因此，範例 19-33 中 `name` 變數會包含一個 `Ident` 結構體的實例，當列印時，會是字串 `"Pancakes"`，也就是範例 19-30 中結構體的名稱。

`quote!` 宏讓我們可以編寫希望返回的 Rust 代碼。`quote!` 宏執行的直接結果並不是編譯器所期望的並需要轉換為 `TokenStream`。為此需要調用 `into` 方法，它會消費這個中間表示（intermediate representation，IR）並返回所需的 `TokenStream` 類型值。

這個宏也提供了一些非常酷的模板機制；我們可以寫 `#name` ，然後 `quote!` 會以名為 `name` 的變數值來替換它。你甚至可以做一些類似常用宏那樣的重複代碼的工作。查閱 [`quote` crate 的文件][quote-docs] 來獲取詳盡的介紹。

[quote-docs]: https://docs.rs/quote

我們期望我們的過程式宏能夠為通過 `#name` 獲取到的用戶註解類型生成 `HelloMacro` trait 的實現。該 trait 的實現有一個函數 `hello_macro` ，其函數體包括了我們期望提供的功能：列印 `Hello, Macro! My name is` 和註解的類型名。

此處所使用的 `stringify!` 為 Rust 內建宏。其接收一個 Rust 表達式，如 `1 + 2` ， 然後在編譯時將表達式轉換為一個字串常量，如 `"1 + 2"` 。這與 `format!` 或 `println!` 是不同的，它計算表達式並將結果轉換為 `String` 。有一種可能的情況是，所輸入的 `#name` 可能是一個需要列印的表達式，因此我們用 `stringify!` 。 `stringify!` 編譯時也保留了一份將 `#name` 轉換為字串之後的記憶體分配。

此時，`cargo build` 應該都能成功編譯 `hello_macro` 和 `hello_macro_derive` 。我們將這些 crate 連接到範例 19-38 的代碼中來看看過程宏的行為！在 *projects* 目錄下用 `cargo new pancakes` 命令新建一個二進位制項目。需要將 `hello_macro` 和 `hello_macro_derive` 作為依賴加到 `pancakes` 包的 *Cargo.toml*  文件中去。如果你正將 `hello_macro` 和 `hello_macro_derive` 的版本發布到 [crates.io](https://crates.io/) 上，其應為常規依賴；如果不是，則可以像下面這樣將其指定為 `path` 依賴：

```toml
[dependencies]
hello_macro = { path = "../hello_macro" }
hello_macro_derive = { path = "../hello_macro/hello_macro_derive" }
```

把範例 19-38 中的代碼放在 *src/main.rs* ，然後執行 `cargo run`：其應該列印 `Hello, Macro! My name is Pancakes!`。其包含了該過程宏中 `HelloMacro` trait 的實現，而無需 `pancakes` crate 實現它；`#[derive(HelloMacro)]` 增加了該 trait 實現。

接下來，讓我們探索一下其他類型的過程宏與自訂派生宏有何區別。

### 類屬性宏

類屬性宏與自訂派生宏相似，不同於為 `derive` 屬性生成代碼，它們允許你創建新的屬性。它們也更為靈活；`derive` 只能用於結構體和枚舉；屬性還可以用於其它的項，比如函數。作為一個使用類屬性宏的例子，可以創建一個名為 `route` 的屬性用於註解 web 應用程式框架（web application framework）的函數：

```rust,ignore
#[route(GET, "/")]
fn index() {
```

`#[route]` 屬性將由框架本身定義為一個過程宏。其宏定義的函數簽名看起來像這樣：

```rust,ignore
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
```

這裡有兩個 `TokenStream` 類型的參數；第一個用於屬性內容本身，也就是 `GET, "/"` 部分。第二個是屬性所標記的項：在本例中，是 `fn index() {}` 和剩下的函數體。

除此之外，類屬性宏與自訂派生宏工作方式一致：創建 `proc-macro` crate 類型的 crate 並實現希望生成代碼的函數！

### 類函數宏

類函數宏定義看起來像函數調用的宏。類似於 `macro_rules!`，它們比函數更靈活；例如，可以接受未知數量的參數。然而 `macro_rules!` 宏只能使用之前 [“使用 `macro_rules!` 的聲明宏用於通用元編程”][decl] 介紹的類匹配的語法定義。類函數宏獲取 `TokenStream` 參數，其定義使用 Rust 代碼操縱 `TokenStream`，就像另兩種過程宏一樣。一個類函數宏例子是可以像這樣被調用的 `sql!` 宏：

[decl]: #declarative-macros-with-macro_rules-for-general-metaprogramming

```rust,ignore
let sql = sql!(SELECT * FROM posts WHERE id=1);
```

這個宏會解析其中的 SQL 語句並檢查其是否是句法正確的，這是比 `macro_rules!` 可以做到的更為複雜的處理。`sql!` 宏應該被定義為如此：

```rust,ignore
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
```

這類似於自訂派生宏的簽名：獲取括號中的 token，並返回希望生成的代碼。

## 總結

好的！現在我們學習了 Rust 並不常用但在特定情況下你可能用得著的功能。我們介紹了很多複雜的主題，這樣若你在錯誤訊息提示或閱讀他人代碼時遇到他們，至少可以說之前已經見過這些概念和語法了。你可以使用本章作為一個解決方案的參考。

接下來，我們將再開始一個項目，將本書所學的所有內容付與實踐！

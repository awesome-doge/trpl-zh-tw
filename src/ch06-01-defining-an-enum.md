## 定義枚舉

> [ch06-01-defining-an-enum.md](https://github.com/rust-lang/book/blob/master/src/ch06-01-defining-an-enum.md)
> <br>
> commit a5a03d8f61a5b2c2111b21031a3f526ef60844dd

讓我們看看一個需要訴諸於代碼的場景，來考慮為何此時使用枚舉更為合適且實用。假設我們要處理 IP 地址。目前被廣泛使用的兩個主要 IP 標準：IPv4（version four）和 IPv6（version six）。這是我們的程序可能會遇到的所有可能的 IP 地址類型：所以可以 **枚舉** 出所有可能的值，這也正是此枚舉名字的由來。

任何一個 IP 地址要嘛是 IPv4 的要嘛是 IPv6 的，而且不能兩者都是。IP 地址的這個特性使得枚舉數據結構非常適合這個場景，因為枚舉值只可能是其中一個成員。IPv4 和 IPv6 從根本上講仍是 IP 地址，所以當代碼在處理適用於任何類型的 IP 地址的場景時應該把它們當作相同的類型。

可以通過在代碼中定義一個 `IpAddrKind` 枚舉來表現這個概念並列出可能的 IP 地址類型，`V4` 和 `V6`。這被稱為枚舉的 **成員**（*variants*）：

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

現在 `IpAddrKind` 就是一個可以在代碼中使用的自訂數據類型了。

### 枚舉值

可以像這樣創建 `IpAddrKind` 兩個不同成員的實例：

```rust
# enum IpAddrKind {
#     V4,
#     V6,
# }
#
let four = IpAddrKind::V4;
let six = IpAddrKind::V6;
```

注意枚舉的成員位於其標識符的命名空間中，並使用兩個冒號分開。這麼設計的益處是現在 `IpAddrKind::V4` 和 `IpAddrKind::V6` 都是 `IpAddrKind` 類型的。例如，接著可以定義一個函數來獲取任何 `IpAddrKind`：

```rust
# enum IpAddrKind {
#     V4,
#     V6,
# }
#
fn route(ip_type: IpAddrKind) { }
```

現在可以使用任一成員來調用這個函數：

```rust
# enum IpAddrKind {
#     V4,
#     V6,
# }
#
# fn route(ip_type: IpAddrKind) { }
#
route(IpAddrKind::V4);
route(IpAddrKind::V6);
```

使用枚舉甚至還有更多優勢。進一步考慮一下我們的 IP 地址類型，目前沒有一個存儲實際 IP 地址 **數據** 的方法；只知道它是什麼 **類型** 的。考慮到已經在第五章學習過結構體了，你可能會像範例 6-1 那樣處理這個問題：

```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

let home = IpAddr {
    kind: IpAddrKind::V4,
    address: String::from("127.0.0.1"),
};

let loopback = IpAddr {
    kind: IpAddrKind::V6,
    address: String::from("::1"),
};
```

<span class="caption">範例 6-1：將 IP 地址的數據和 `IpAddrKind` 成員存儲在一個 `struct` 中</span>

這裡我們定義了一個有兩個欄位的結構體 `IpAddr`：`IpAddrKind`（之前定義的枚舉）類型的 `kind` 欄位和 `String` 類型 `address` 欄位。我們有這個結構體的兩個實例。第一個，`home`，它的 `kind` 的值是 `IpAddrKind::V4` 與之相關聯的地址數據是 `127.0.0.1`。第二個實例，`loopback`，`kind` 的值是 `IpAddrKind` 的另一個成員，`V6`，關聯的地址是 `::1`。我們使用了一個結構體來將 `kind` 和 `address` 打包在一起，現在枚舉成員就與值相關聯了。

我們可以使用一種更簡潔的方式來表達相同的概念，僅僅使用枚舉並將數據直接放進每一個枚舉成員而不是將枚舉作為結構體的一部分。`IpAddr` 枚舉的新定義表明了 `V4` 和 `V6` 成員都關聯了 `String` 值：

```rust
enum IpAddr {
    V4(String),
    V6(String),
}

let home = IpAddr::V4(String::from("127.0.0.1"));

let loopback = IpAddr::V6(String::from("::1"));
```

我們直接將數據附加到枚舉的每個成員上，這樣就不需要一個額外的結構體了。

用枚舉替代結構體還有另一個優勢：每個成員可以處理不同類型和數量的數據。IPv4 版本的 IP 地址總是含有四個值在 0 和 255 之間的數字部分。如果我們想要將 `V4` 地址存儲為四個 `u8` 值而 `V6` 地址仍然表現為一個 `String`，這就不能使用結構體了。枚舉則可以輕易處理的這個情況：

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);

let loopback = IpAddr::V6(String::from("::1"));
```

這些程式碼展示了使用枚舉來存儲兩種不同 IP 地址的幾種可能的選擇。然而，事實證明存儲和編碼 IP 地址實在是太常見了[以致標準庫提供了一個開箱即用的定義！][IpAddr]<!-- ignore -->讓我們看看標準庫是如何定義 `IpAddr` 的：它正有著跟我們定義和使用的一樣的枚舉和成員，不過它將成員中的地址數據嵌入到了兩個不同形式的結構體中，它們對不同的成員的定義是不同的：

[IpAddr]: https://doc.rust-lang.org/std/net/enum.IpAddr.html

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

這些程式碼展示了可以將任意類型的數據放入枚舉成員中：例如字串、數字類型或者結構體。甚至可以包含另一個枚舉！另外，標準庫中的類型通常並不比你設想出來的要複雜多少。

注意雖然標準庫中包含一個 `IpAddr` 的定義，仍然可以創建和使用我們自己的定義而不會有衝突，因為我們並沒有將標準庫中的定義引入作用域。第七章會講到如何導入類型。

來看看範例 6-2 中的另一個枚舉的例子：它的成員中內嵌了多種多樣的類型：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

<span class="caption">範例 6-2：一個 `Message` 枚舉，其每個成員都存儲了不同數量和類型的值</span>

這個枚舉有四個含有不同類型的成員：

* `Quit` 沒有關聯任何數據。
* `Move` 包含一個匿名結構體。
* `Write` 包含單獨一個 `String`。
* `ChangeColor` 包含三個 `i32`。

定義一個如範例 6-2 中所示那樣的有關聯值的枚舉的方式和定義多個不同類型的結構體的方式很相像，除了枚舉不使用 `struct` 關鍵字以及其所有成員都被組合在一起位於 `Message` 類型下。如下這些結構體可以包含與之前枚舉成員中相同的數據：

```rust
struct QuitMessage; // 類單元結構體
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元組結構體
struct ChangeColorMessage(i32, i32, i32); // 元組結構體
```

不過，如果我們使用不同的結構體，由於它們都有不同的類型，我們將不能像使用範例 6-2 中定義的 `Message` 枚舉那樣，輕易的定義一個能夠處理這些不同類型的結構體的函數，因為枚舉是單獨一個類型。

結構體和枚舉還有另一個相似點：就像可以使用 `impl` 來為結構體定義方法那樣，也可以在枚舉上定義方法。這是一個定義於我們 `Message` 枚舉上的叫做 `call` 的方法：

```rust
# enum Message {
#     Quit,
#     Move { x: i32, y: i32 },
#     Write(String),
#     ChangeColor(i32, i32, i32),
# }
#
impl Message {
    fn call(&self) {
        // 在這裡定義方法體
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```

方法體使用了 `self` 來獲取調用方法的值。這個例子中，創建了一個值為 `Message::Write(String::from("hello"))` 的變數 `m`，而且這就是當 `m.call()` 運行時 `call` 方法中的 `self` 的值。

讓我們看看標準庫中的另一個非常常見且實用的枚舉：`Option`。

### `Option` 枚舉和其相對於空值的優勢

在之前的部分，我們看到了 `IpAddr` 枚舉如何利用 Rust 的類型系統在程序中編碼更多訊息而不單單是數據。接下來我們分析一個 `Option` 的案例，`Option` 是標準庫定義的另一個枚舉。`Option` 類型應用廣泛因為它編碼了一個非常普遍的場景，即一個值要嘛有值要嘛沒值。從類型系統的角度來表達這個概念就意味著編譯器需要檢查是否處理了所有應該處理的情況，這樣就可以避免在其他程式語言中非常常見的 bug。

程式語言的設計經常要考慮包含哪些功能，但考慮排除哪些功能也很重要。Rust 並沒有很多其他語言中有的空值功能。**空值**（*Null* ）是一個值，它代表沒有值。在有空值的語言中，變數總是這兩種狀態之一：空值和非空值。

Tony Hoare，null 的發明者，在他 2009 年的演講 “Null References: The Billion Dollar Mistake” 中曾經說到：

> I call it my billion-dollar mistake. At that time, I was designing the first
> comprehensive type system for references in an object-oriented language. My
> goal was to ensure that all use of references should be absolutely safe, with
> checking performed automatically by the compiler. But I couldn't resist the
> temptation to put in a null reference, simply because it was so easy to
> implement. This has led to innumerable errors, vulnerabilities, and system
> crashes, which have probably caused a billion dollars of pain and damage in
> the last forty years.
>
> 我稱之為我十億美元的錯誤。當時，我在為一個面向對象語言設計第一個綜合性的面向引用的類型系統。我的目標是透過編譯器的自動檢查來保證所有引用的使用都應該是絕對安全的。不過我未能抵抗住引入一個空引用的誘惑，僅僅是因為它是這麼的容易實現。這引發了無數錯誤、漏洞和系統崩潰，在之後的四十多年中造成了數十億美元的苦痛和傷害。

空值的問題在於當你嘗試像一個非空值那樣使用一個空值，會出現某種形式的錯誤。因為空和非空的屬性無處不在，非常容易出現這類錯誤。

然而，空值嘗試表達的概念仍然是有意義的：空值是一個因為某種原因目前無效或缺失的值。

問題不在於概念而在於具體的實現。為此，Rust 並沒有空值，不過它確實擁有一個可以編碼存在或不存在概念的枚舉。這個枚舉是 `Option<T>`，而且它[定義於標準庫中][option]<!-- ignore -->，如下:

[option]: https://doc.rust-lang.org/std/option/enum.Option.html

```rust
enum Option<T> {
    Some(T),
    None,
}
```

`Option<T>` 枚舉是如此有用以至於它甚至被包含在了 prelude 之中，你不需要將其顯式引入作用域。另外，它的成員也是如此，可以不需要 `Option::` 前綴來直接使用 `Some` 和 `None`。即便如此 `Option<T>` 也仍是常規的枚舉，`Some(T)` 和 `None` 仍是 `Option<T>` 的成員。

`<T>` 語法是一個我們還未講到的 Rust 功能。它是一個泛型類型參數，第十章會更詳細的講解泛型。目前，所有你需要知道的就是 `<T>` 意味著 `Option` 枚舉的 `Some` 成員可以包含任意類型的數據。這裡是一些包含數字類型和字串類型 `Option` 值的例子：

```rust
let some_number = Some(5);
let some_string = Some("a string");

let absent_number: Option<i32> = None;
```

如果使用 `None` 而不是 `Some`，需要告訴 Rust `Option<T>` 是什麼類型的，因為編譯器只通過 `None` 值無法推斷出 `Some` 成員保存的值的類型。

當有一個 `Some` 值時，我們就知道存在一個值，而這個值保存在 `Some` 中。當有個 `None` 值時，在某種意義上，它跟空值具有相同的意義：並沒有一個有效的值。那麼，`Option<T>` 為什麼就比空值要好呢？

簡而言之，因為 `Option<T>` 和 `T`（這裡 `T` 可以是任何類型）是不同的類型，編譯器不允許像一個肯定有效的值那樣使用 `Option<T>`。例如，這段代碼不能編譯，因為它嘗試將 `Option<i8>` 與 `i8` 相加：

```rust,ignore
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;
```

如果運行這些程式碼，將得到類似這樣的錯誤訊息：

```text
error[E0277]: the trait bound `i8: std::ops::Add<std::option::Option<i8>>` is
not satisfied
 -->
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + std::option::Option<i8>`
  |
```

很好！事實上，錯誤訊息意味著 Rust 不知道該如何將 `Option<i8>` 與 `i8` 相加，因為它們的類型不同。當在 Rust 中擁有一個像 `i8` 這樣類型的值時，編譯器確保它總是有一個有效的值。我們可以自信使用而無需做空值檢查。只有當使用 `Option<i8>`（或者任何用到的類型）的時候需要擔心可能沒有值，而編譯器會確保我們在使用值之前處理了為空的情況。

換句話說，在對 `Option<T>` 進行 `T` 的運算之前必須將其轉換為 `T`。通常這能幫助我們捕獲到空值最常見的問題之一：假設某值不為空但實際上為空的情況。

不再擔心會錯誤的假設一個非空值，會讓你對代碼更加有信心。為了擁有一個可能為空的值，你必須要顯式的將其放入對應類型的 `Option<T>` 中。接著，當使用這個值時，必須明確的處理值為空的情況。只要一個值不是 `Option<T>` 類型，你就 **可以** 安全的認定它的值不為空。這是 Rust 的一個經過深思熟慮的設計決策，來限制空值的泛濫以增加 Rust 代碼的安全性。

那麼當有一個 `Option<T>` 的值時，如何從 `Some` 成員中取出 `T` 的值來使用它呢？`Option<T>` 枚舉擁有大量用於各種情況的方法：你可以查看[它的文件][docs]<!-- ignore -->。熟悉 `Option<T>` 的方法將對你的 Rust 之旅非常有用。

[docs]: https://doc.rust-lang.org/std/option/enum.Option.html

總的來說，為了使用 `Option<T>` 值，需要編寫處理每個成員的代碼。你想要一些程式碼只當擁有 `Some(T)` 值時運行，允許這些程式碼使用其中的 `T`。也希望一些程式碼在值為 `None` 時運行，這些程式碼並沒有一個可用的 `T` 值。`match` 表達式就是這麼一個處理枚舉的控制流結構：它會根據枚舉的成員運行不同的代碼，這些程式碼可以使用匹配到的值中的數據。

## 定義並實例化結構體

> [ch05-01-defining-structs.md](https://github.com/rust-lang/book/blob/master/src/ch05-01-defining-structs.md)
> <br>
> commit f617d58c1a88dd2912739a041fd4725d127bf9fb

結構體和我們在第三章討論過的元組類似。和元組一樣，結構體的每一部分可以是不同類型。但不同於元組，結構體需要命名各部分數據以便能清楚的表明其值的意義。由於有了這些名字，結構體比元組更靈活：不需要依賴順序來指定或訪問實例中的值。

定義結構體，需要使用 `struct` 關鍵字並為整個結構體提供一個名字。結構體的名字需要描述它所組合的數據的意義。接著，在大括號中，定義每一部分數據的名字和類型，我們稱為 **欄位**（*field*）。例如，範例 5-1 展示了一個存儲用戶帳號訊息的結構體：

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}
```

<span class="caption">範例 5-1：`User` 結構體定義</span>

一旦定義了結構體後，為了使用它，透過為每個欄位指定具體值來創建這個結構體的 **實例**。創建一個實例需要以結構體的名字開頭，接著在大括號中使用 `key: value` 鍵-值對的形式提供欄位，其中 key 是欄位的名字，value 是需要存儲在欄位中的數據值。實例中欄位的順序不需要和它們在結構體中聲明的順序一致。換句話說，結構體的定義就像一個類型的通用模板，而實例則會在這個模板中放入特定數據來創建這個類型的值。例如，可以像範例 5-2 這樣來聲明一個特定的用戶：

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};
```

<span class="caption">範例 5-2：創建 `User` 結構體的實例</span>

為了從結構體中獲取某個特定的值，可以使用點號。如果我們只想要用戶的信箱地址，可以用 `user1.email`。要更改結構體中的值，如果結構體的實例是可變的，我們可以使用點號並為對應的欄位賦值。範例 5-3 展示了如何改變一個可變的 `User` 實例 `email` 欄位的值：

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
let mut user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};

user1.email = String::from("anotheremail@example.com");
```

<span class="caption">範例 5-3：改變 `User` 實例 `email` 欄位的值</span>

注意整個實例必須是可變的；Rust 並不允許只將某個欄位標記為可變。另外需要注意同其他任何表達式一樣，我們可以在函數體的最後一個表達式中構造一個結構體的新實例，來隱式地返回這個實例。

範例 5-4 顯示了一個 `build_user` 函數，它返回一個帶有給定的 email 和使用者名稱的 `User` 結構體實例。`active` 欄位的值為 `true`，並且 `sign_in_count` 的值為 `1`。

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
fn build_user(email: String, username: String) -> User {
    User {
        email: email,
        username: username,
        active: true,
        sign_in_count: 1,
    }
}
```

<span class="caption">範例 5-4：`build_user` 函數獲取 email 和使用者名稱並返回 `User` 實例</span>

為函數參數起與結構體欄位相同的名字是可以理解的，但是不得不重複 `email` 和 `username` 欄位名稱與變數有些囉嗦。如果結構體有更多欄位，重複每個名稱就更加煩人了。幸運的是，有一個方便的簡寫語法！

### 變數與欄位同名時的欄位初始化簡寫語法

因為範例 5-4 中的參數名與欄位名都完全相同，我們可以使用 **欄位初始化簡寫語法**（*field init shorthand*）來重寫 `build_user`，這樣其行為與之前完全相同，不過無需重複 `email` 和 `username` 了，如範例 5-5 所示。

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 1,
    }
}
```

<span class="caption">範例 5-5：`build_user` 函數使用了欄位初始化簡寫語法，因為 `email` 和 `username` 參數與結構體欄位同名</span>

這裡我們創建了一個新的 `User` 結構體實例，它有一個叫做 `email` 的欄位。我們想要將 `email` 欄位的值設置為 `build_user` 函數 `email` 參數的值。因為 `email` 欄位與 `email` 參數有著相同的名稱，則只需編寫 `email` 而不是 `email: email`。

### 使用結構體更新語法從其他實例創建實例

使用舊實例的大部分值但改變其部分值來創建一個新的結構體實例通常是很有幫助的。這可以通過 **結構體更新語法**（*struct update syntax*）實現。

首先，範例 5-6 展示了不使用更新語法時，如何在 `user2` 中創建一個新 `User` 實例。我們為 `email` 和 `username` 設置了新的值，其他值則使用了實例 5-2 中創建的 `user1` 中的同名值：

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
# let user1 = User {
#     email: String::from("someone@example.com"),
#     username: String::from("someusername123"),
#     active: true,
#     sign_in_count: 1,
# };
#
let user2 = User {
    email: String::from("another@example.com"),
    username: String::from("anotherusername567"),
    active: user1.active,
    sign_in_count: user1.sign_in_count,
};
```

<span class="caption">範例 5-6：創建 `User` 新實例，其使用了一些來自 `user1` 的值</span>

使用結構體更新語法，我們可以透過更少的代碼來達到相同的效果，如範例 5-7 所示。`..` 語法指定了剩餘未顯式設置值的欄位應有與給定實例對應欄位相同的值。

```rust
# struct User {
#     username: String,
#     email: String,
#     sign_in_count: u64,
#     active: bool,
# }
#
# let user1 = User {
#     email: String::from("someone@example.com"),
#     username: String::from("someusername123"),
#     active: true,
#     sign_in_count: 1,
# };
#
let user2 = User {
    email: String::from("another@example.com"),
    username: String::from("anotherusername567"),
    ..user1
};
```

<span class="caption">範例 5-7：使用結構體更新語法為一個 `User` 實例設置新的 `email` 和 `username` 值，不過其餘值來自 `user1` 變數中實例的欄位</span>

範例 5-7 中的代碼也在 `user2` 中創建了一個新實例，其有不同的 `email` 和 `username` 值不過 `active` 和 `sign_in_count` 欄位的值與 `user1` 相同。

### 使用沒有命名欄位的元組結構體來創建不同的類型

也可以定義與元組（在第三章討論過）類似的結構體，稱為 **元組結構體**（*tuple structs*）。元組結構體有著結構體名稱提供的含義，但沒有具體的欄位名，只有欄位的類型。當你想給整個元組取一個名字，並使元組成為與其他元組不同的類型時，元組結構體是很有用的，這時像常規結構體那樣為每個欄位命名就顯得多餘和形式化了。

要定義元組結構體，以 `struct` 關鍵字和結構體名開頭並後跟元組中的類型。例如，下面是兩個分別叫做 `Color` 和 `Point` 元組結構體的定義和用法：

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);
```

注意 `black` 和 `origin` 值的類型不同，因為它們是不同的元組結構體的實例。你定義的每一個結構體有其自己的類型，即使結構體中的欄位有著相同的類型。例如，一個獲取 `Color` 類型參數的函數不能接受 `Point` 作為參數，即便這兩個類型都由三個 `i32` 值組成。在其他方面，元組結構體實例類似於元組：可以將其解構為單獨的部分，也可以使用 `.` 後跟索引來訪問單獨的值，等等。

### 沒有任何欄位的類單元結構體

我們也可以定義一個沒有任何欄位的結構體！它們被稱為 **類單元結構體**（*unit-like structs*）因為它們類似於 `()`，即 unit 類型。類單元結構體常常在你想要在某個類型上實現 trait 但不需要在類型中存儲數據的時候發揮作用。我們將在第十章介紹 trait。

> ### 結構體數據的所有權
>
> 在範例 5-1 中的 `User` 結構體的定義中，我們使用了自身擁有所有權的 `String` 類型而不是 `&str` 字串 slice 類型。這是一個有意而為之的選擇，因為我們想要這個結構體擁有它所有的數據，為此只要整個結構體是有效的話其數據也是有效的。
>
> 可以使結構體存儲被其他對象擁有的數據的引用，不過這麼做的話需要用上 **生命週期**（*lifetimes*），這是一個第十章會討論的 Rust 功能。生命週期確保結構體引用的數據有效性跟結構體本身保持一致。如果你嘗試在結構體中存儲一個引用而不指定生命週期將是無效的，比如這樣：
>
> <span class="filename">檔案名: src/main.rs</span>
>
> ```rust,ignore,does_not_compile
> struct User {
>     username: &str,
>     email: &str,
>     sign_in_count: u64,
>     active: bool,
> }
>
> fn main() {
>     let user1 = User {
>         email: "someone@example.com",
>         username: "someusername123",
>         active: true,
>         sign_in_count: 1,
>     };
> }
> ```
>
> 編譯器會抱怨它需要生命週期標識符：
>
> ```text
> error[E0106]: missing lifetime specifier
>  -->
>   |
> 2 |     username: &str,
>   |               ^ expected lifetime parameter
>
> error[E0106]: missing lifetime specifier
>  -->
>   |
> 3 |     email: &str,
>   |            ^ expected lifetime parameter
> ```
>
> 第十章會講到如何修復這個問題以便在結構體中存儲引用，不過現在，我們會使用像 `String` 這類擁有所有權的類型來替代 `&str` 這樣的引用以修正這個錯誤。

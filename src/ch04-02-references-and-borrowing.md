## 引用與借用

> [ch04-02-references-and-borrowing.md](https://github.com/rust-lang/book/blob/master/src/ch04-02-references-and-borrowing.md)
> <br>
> commit 4f19894e592cd24ac1476f1310dcf437ae83d4ba

範例 4-5 中的元組代碼有這樣一個問題：我們必須將 `String` 返回給調用函數，以便在調用 `calculate_length` 後仍能使用 `String`，因為 `String` 被移動到了 `calculate_length` 內。

下面是如何定義並使用一個（新的）`calculate_length` 函數，它以一個對象的引用作為參數而不是獲取值的所有權：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

首先，注意變數聲明和函數返回值中的所有元組代碼都消失了。其次，注意我們傳遞 `&s1` 給 `calculate_length`，同時在函數定義中，我們獲取 `&String` 而不是 `String`。

這些 & 符號就是 **引用**，它們允許你使用值但不獲取其所有權。圖 4-5 展示了一張示意圖。

<img alt="&String s pointing at String s1" src="img/trpl04-05.svg" class="center" />

<span class="caption">圖 4-5：`&String s` 指向 `String s1` 示意圖</span>

> 注意：與使用 `&` 引用相反的操作是 **解引用**（*dereferencing*），它使用解引用運算符，`*`。我們將會在第八章遇到一些解引用運算符，並在第十五章詳細討論解引用。

仔細看看這個函數調用：

```rust
# fn calculate_length(s: &String) -> usize {
#     s.len()
# }
let s1 = String::from("hello");

let len = calculate_length(&s1);
```

`&s1` 語法讓我們創建一個 **指向** 值 `s1` 的引用，但是並不擁有它。因為並不擁有這個值，當引用離開作用域時其指向的值也不會被丟棄。

同理，函數簽名使用 `&` 來表明參數 `s` 的類型是一個引用。讓我們增加一些解釋性的注釋：

```rust
fn calculate_length(s: &String) -> usize { // s 是對 String 的引用
    s.len()
} // 這裡，s 離開了作用域。但因為它並不擁有引用值的所有權，
  // 所以什麼也不會發生
```

變數 `s` 有效的作用域與函數參數的作用域一樣，不過當引用離開作用域後並不丟棄它指向的數據，因為我們沒有所有權。當函數使用引用而不是實際值作為參數，無需返回值來交還所有權，因為就不曾擁有所有權。

我們將獲取引用作為函數參數稱為 **借用**（*borrowing*）。正如現實生活中，如果一個人擁有某樣東西，你可以從他那裡借來。當你使用完畢，必須還回去。

如果我們嘗試修改借用的變數呢？嘗試範例 4-6 中的代碼。劇透：這行不通！

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let s = String::from("hello");

    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world");
}
```

<span class="caption">範例 4-6：嘗試修改借用的值</span>

這裡是錯誤：

```text
error[E0596]: cannot borrow immutable borrowed content `*some_string` as mutable
 --> error.rs:8:5
  |
7 | fn change(some_string: &String) {
  |                        ------- use `&mut String` here to make mutable
8 |     some_string.push_str(", world");
  |     ^^^^^^^^^^^ cannot borrow as mutable
```

正如變數預設是不可變的，引用也一樣。（默認）不允許修改引用的值。

### 可變引用

我們通過一個小調整就能修復範例 4-6 代碼中的錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

首先，必須將 `s` 改為 `mut`。然後必須創建一個可變引用 `&mut s` 和接受一個可變引用 `some_string: &mut String`。

不過可變引用有一個很大的限制：在特定作用域中的特定數據只能有一個可變引用。這些程式碼會失敗：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s;

println!("{}, {}", r1, r2);
```


錯誤如下：

```text
error[E0499]: cannot borrow `s` as mutable more than once at a time
 --> src/main.rs:5:14
  |
4 |     let r1 = &mut s;
  |              ------ first mutable borrow occurs here
5 |     let r2 = &mut s;
  |              ^^^^^^ second mutable borrow occurs here
6 |
7 |     println!("{}, {}", r1, r2);
  |                        -- first borrow later used here
```

這個限制允許可變性，不過是以一種受限制的方式允許。新 Rustacean 們經常難以適應這一點，因為大部分語言中變數任何時候都是可變的。

這個限制的好處是 Rust 可以在編譯時就避免數據競爭。**數據競爭**（*data race*）類似於競態條件，它可由這三個行為造成：

* 兩個或更多指針同時訪問同一數據。
* 至少有一個指針被用來寫入數據。
* 沒有同步數據訪問的機制。

數據競爭會導致未定義行為，難以在運行時追蹤，並且難以診斷和修復；Rust 避免了這種情況的發生，因為它甚至不會編譯存在數據競爭的代碼！

一如既往，可以使用大括號來創建一個新的作用域，以允許擁有多個可變引用，只是不能 **同時** 擁有：

```rust
let mut s = String::from("hello");

{
    let r1 = &mut s;

} // r1 在這裡離開了作用域，所以我們完全可以創建一個新的引用

let r2 = &mut s;
```

類似的規則也存在於同時使用可變與不可變引用中。這些程式碼會導致一個錯誤：

```rust,ignore,does_not_compile
let mut s = String::from("hello");

let r1 = &s; // 沒問題
let r2 = &s; // 沒問題
let r3 = &mut s; // 大問題

println!("{}, {}, and {}", r1, r2, r3);
```

錯誤如下：

```text
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:14
  |
4 |     let r1 = &s; // no problem
  |              -- immutable borrow occurs here
5 |     let r2 = &s; // no problem
6 |     let r3 = &mut s; // BIG PROBLEM
  |              ^^^^^^ mutable borrow occurs here
7 |
8 |     println!("{}, {}, and {}", r1, r2, r3);
  |                                -- immutable borrow later used here
```

哇哦！我們 **也** 不能在擁有不可變引用的同時擁有可變引用。不可變引用的用戶可不希望在他們的眼皮底下值就被意外的改變了！然而，多個不可變引用是可以的，因為沒有哪個只能讀取數據的人有能力影響其他人讀取到的數據。

注意一個引用的作用域從聲明的地方開始一直持續到最後一次使用為止。例如，因為最後一次使用不可變引用在聲明可變引用之前，所以如下代碼是可以編譯的：

```rust,edition2018,ignore
let mut s = String::from("hello");

let r1 = &s; // 沒問題
let r2 = &s; // 沒問題
println!("{} and {}", r1, r2);
// 此位置之後 r1 和 r2 不再使用

let r3 = &mut s; // 沒問題
println!("{}", r3);
```

不可變引用 `r1` 和 `r2` 的作用域在 `println!` 最後一次使用之後結束，這也是創建可變引用 `r3` 的地方。它們的作用域沒有重疊，所以代碼是可以編譯的。

儘管這些錯誤有時使人沮喪，但請牢記這是 Rust 編譯器在提前指出一個潛在的 bug（在編譯時而不是在運行時）並精準顯示問題所在。這樣你就不必去跟蹤為何數據並不是你想像中的那樣。

### 懸垂引用（Dangling References）

在具有指針的語言中，很容易透過釋放記憶體時保留指向它的指針而錯誤地生成一個 **懸垂指針**（*dangling pointer*），所謂懸垂指針是其指向的記憶體可能已經被分配給其它持有者。相比之下，在 Rust 中編譯器確保引用永遠也不會變成懸垂狀態：當你擁有一些數據的引用，編譯器確保數據不會在其引用之前離開作用域。

讓我們嘗試創建一個懸垂引用，Rust 會透過一個編譯時錯誤來避免：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String {
    let s = String::from("hello");

    &s
}
```

這裡是錯誤：

```text
error[E0106]: missing lifetime specifier
 --> main.rs:5:16
  |
5 | fn dangle() -> &String {
  |                ^ expected lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is
  no value for it to be borrowed from
  = help: consider giving it a 'static lifetime
```

錯誤訊息引用了一個我們還未介紹的功能：生命週期（lifetimes）。第十章會詳細介紹生命週期。不過，如果你不理會生命週期部分，錯誤訊息中確實包含了為什麼這段代碼有問題的關鍵訊息：

```text
this function's return type contains a borrowed value, but there is no value for it to be borrowed from.
```

讓我們仔細看看我們的 `dangle` 代碼的每一步到底發生了什麼事：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn dangle() -> &String { // dangle 返回一個字串的引用

    let s = String::from("hello"); // s 是一個新字串

    &s // 返回字串 s 的引用
} // 這裡 s 離開作用域並被丟棄。其記憶體被釋放。
  // 危險！
```

因為 `s` 是在 `dangle` 函數內創建的，當 `dangle` 的代碼執行完畢後，`s` 將被釋放。不過我們嘗試返回它的引用。這意味著這個引用會指向一個無效的 `String`，這可不對！Rust 不會允許我們這麼做。

這裡的解決方法是直接返回 `String`：

```rust
fn no_dangle() -> String {
    let s = String::from("hello");

    s
}
```

這樣就沒有任何錯誤了。所有權被移動出去，所以沒有值被釋放。

### 引用的規則

讓我們概括一下之前對引用的討論：

* 在任意給定時間，**要嘛** 只能有一個可變引用，**要嘛** 只能有多個不可變引用。
* 引用必須總是有效的。

接下來，我們來看看另一種不同類型的引用：slice。

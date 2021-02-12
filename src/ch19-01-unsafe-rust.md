## 不安全 Rust

> [ch19-01-unsafe-rust.md](https://github.com/rust-lang/book/blob/master/src/ch19-01-unsafe-rust.md)
> <br>
> commit 28fa3d15b0bc67ea5e79eeff2198e4277fc61baf

目前為止討論過的代碼都有 Rust 在編譯時會強制執行的記憶體安全保證。然而，Rust 還隱藏有第二種語言，它不會強制執行這類記憶體安全保證：這被稱為 **不安全 Rust**（*unsafe Rust*）。它與常規 Rust 代碼無異，但是會提供額外的超級力量。

不安全 Rust 之所以存在，是因為靜態分析本質上是保守的。當編譯器嘗試確定一段代碼是否支持某個保證時，拒絕一些有效的程序比接受無效程序要好一些。這必然意味著有時代碼可能是合法的，但是 Rust 不這麼認為！在這種情況下，可以使用不安全代碼告訴編譯器，“相信我，我知道我在幹什麼。”這麼做的缺點就是你只能靠自己了：如果不安全代碼出錯了，比如解引用空指針，可能會導致不安全的記憶體使用。

另一個 Rust 存在不安全一面的原因是：底層計算機硬體固有的不安全性。如果 Rust 不允許進行不安全操作，那麼有些任務則根本完成不了。Rust 需要能夠進行像直接與操作系統交互，甚至於編寫你自己的操作系統這樣的底層系統編程！這也是 Rust 語言的目標之一。讓我們看看不安全 Rust 能做什麼，和怎麼做。

### 不安全的超級力量

可以通過 `unsafe` 關鍵字來切換到不安全 Rust，接著可以開啟一個新的存放不安全代碼的塊。這裡有五類可以在不安全 Rust 中進行而不能用於安全 Rust 的操作，它們稱之為 “不安全的超級力量。” 這些超級力量是：

* 解引用裸指針
* 調用不安全的函數或方法
* 訪問或修改可變靜態變數
* 實現不安全 trait
* 訪問 `union` 的欄位

有一點很重要，`unsafe` 並不會關閉借用檢查器或禁用任何其他 Rust 安全檢查：如果在不安全代碼中使用引用，它仍會被檢查。`unsafe` 關鍵字只是提供了那五個不會被編譯器檢查記憶體安全的功能。你仍然能在不安全塊中獲得某種程度的安全。

再者，`unsafe` 不意味著塊中的代碼就一定是危險的或者必然導致記憶體安全問題：其意圖在於作為程式設計師你將會確保 `unsafe` 塊中的代碼以有效的方式訪問記憶體。

人是會犯錯誤的，錯誤總會發生，不過通過要求這五類操作必須位於標記為 `unsafe` 的塊中，就能夠知道任何與記憶體安全相關的錯誤必定位於 `unsafe` 塊內。保持 `unsafe` 塊儘可能小，如此當之後調查記憶體 bug 時就會感謝你自己了。

為了儘可能隔離不安全代碼，將不安全代碼封裝進一個安全的抽象並提供安全 API 是一個好主意，當我們學習不安全函數和方法時會討論到。標準庫的一部分被實現為在被評審過的不安全代碼之上的安全抽象。這個技術防止了 `unsafe` 洩露到所有你或者用戶希望使用由 `unsafe` 代碼實現的功能的地方，因為使用其安全抽象是安全的。

讓我們按順序依次介紹上述五個超級力量，同時我們會看到一些提供不安全代碼的安全介面的抽象。

### 解引用裸指針

回到第四章的 [“懸垂引用”][dangling-references]  部分，那裡提到了編譯器會確保引用總是有效的。不安全 Rust 有兩個被稱為 **裸指針**（*raw pointers*）的類似於引用的新類型。和引用一樣，裸指針是不可變或可變的，分別寫作 `*const T` 和 `*mut T`。這裡的星號不是解引用運算符；它是類型名稱的一部分。在裸指針的上下文中，**不可變** 意味著指針解引用之後不能直接賦值。

與引用和智慧指針的區別在於，記住裸指針

* 允許忽略借用規則，可以同時擁有不可變和可變的指針，或多個指向相同位置的可變指針
* 不保證指向有效的記憶體
* 允許為空
* 不能實現任何自動清理功能

通過去掉 Rust 強加的保證，你可以放棄安全保證以換取性能或使用另一個語言或硬體介面的能力，此時 Rust 的保證並不適用。

範例 19-1 展示了如何從引用同時創建不可變和可變裸指針。

```rust
let mut num = 5;

let r1 = &num as *const i32;
let r2 = &mut num as *mut i32;
```

<span class="caption">範例 19-1: 透過引用創建裸指針</span>

注意這裡沒有引入 `unsafe` 關鍵字。可以在安全代碼中 **創建** 裸指針，只是不能在不安全塊之外 **解引用** 裸指針，稍後便會看到。

這裡使用 `as` 將不可變和可變引用強轉為對應的裸指針類型。因為直接從保證安全的引用來創建他們，可以知道這些特定的裸指針是有效，但是不能對任何裸指針做出如此假設。

接下來會創建一個不能確定其有效性的裸指針，範例 19-2 展示了如何創建一個指向任意記憶體地址的裸指針。嘗試使用任意記憶體是未定義行為：此地址可能有數據也可能沒有，編譯器可能會最佳化掉這個記憶體訪問，或者程序可能會出現段錯誤（segmentation fault）。通常沒有好的理由編寫這樣的代碼，不過卻是可行的：

```rust
let address = 0x012345usize;
let r = address as *const i32;
```

<span class="caption">範例 19-2: 創建指向任意記憶體地址的裸指針</span>

記得我們說過可以在安全代碼中創建裸指針，不過不能 **解引用** 裸指針和讀取其指向的數據。現在我們要做的就是對裸指針使用解引用運算符 `*`，這需要一個 `unsafe` 塊，如範例 19-3 所示：

```rust,unsafe
let mut num = 5;

let r1 = &num as *const i32;
let r2 = &mut num as *mut i32;

unsafe {
    println!("r1 is: {}", *r1);
    println!("r2 is: {}", *r2);
}
```

<span class="caption">範例 19-3: 在 `unsafe` 塊中解引用裸指針</span>

創建一個指針不會造成任何危險；只有當訪問其指向的值時才有可能遇到無效的值。

還需注意範例 19-1 和 19-3 中創建了同時指向相同記憶體位置 `num` 的裸指針 `*const i32` 和 `*mut i32`。相反如果嘗試創建 `num` 的不可變和可變引用，這將無法編譯因為 Rust 的所有權規則不允許擁有可變引用的同時擁有不可變引用。通過裸指針，就能夠同時創建同一地址的可變指針和不可變指針，若通過可變指針修改數據，則可能潛在造成數據競爭。請多加小心！

既然存在這麼多的危險，為何還要使用裸指針呢？一個主要的應用場景便是調用 C 代碼介面，這在下一部分 [“調用不安全函數或方法”](#calling-an-unsafe-function-or-method)  中會講到。另一個場景是構建借用檢查器無法理解的安全抽象。讓我們先介紹不安全函數，接著看一看使用不安全代碼的安全抽象的例子。

### 調用不安全函數或方法

第二類要求使用不安全塊的操作是調用不安全函數。不安全函數和方法與常規函數方法十分類似，除了其開頭有一個額外的 `unsafe`。在此上下文中，關鍵字`unsafe`表示該函數具有調用時需要滿足的要求，而 Rust 不會保證滿足這些要求。通過在 `unsafe` 塊中調用不安全函數，表明我們已經閱讀過此函數的文件並對其是否滿足函數自身的契約負責。

如下是一個沒有做任何操作的不安全函數 `dangerous` 的例子：

```rust,unsafe
unsafe fn dangerous() {}

unsafe {
    dangerous();
}
```

必須在一個單獨的 `unsafe` 塊中調用 `dangerous` 函數。如果嘗試不使用 `unsafe` 塊調用 `dangerous`，則會得到一個錯誤：

```text
error[E0133]: call to unsafe function requires unsafe function or block
 -->
  |
4 |     dangerous();
  |     ^^^^^^^^^^^ call to unsafe function
```

透過將 `dangerous` 調用插入 `unsafe` 塊中，我們就向 Rust 保證了我們已經閱讀過函數的文件，理解如何正確使用，並驗證過其滿足函數的契約。

不安全函數體也是有效的 `unsafe` 塊，所以在不安全函數中進行另一個不安全操作時無需新增額外的 `unsafe` 塊。

#### 創建不安全代碼的安全抽象

僅僅因為函數包含不安全代碼並不意味著整個函數都需要標記為不安全的。事實上，將不安全代碼封裝進安全函數是一個常見的抽象。作為一個例子，標準庫中的函數，`split_at_mut`，它需要一些不安全代碼，讓我們探索如何可以實現它。這個安全函數定義於可變 slice 之上：它獲取一個 slice 並從給定的索引參數開始將其分為兩個 slice。`split_at_mut` 的用法如範例 19-4 所示：

```rust
let mut v = vec![1, 2, 3, 4, 5, 6];

let r = &mut v[..];

let (a, b) = r.split_at_mut(3);

assert_eq!(a, &mut [1, 2, 3]);
assert_eq!(b, &mut [4, 5, 6]);
```

<span class="caption">範例 19-4: 使用安全的 `split_at_mut` 函數</span>

這個函數無法只通過安全 Rust 實現。一個嘗試可能看起來像範例 19-5，它不能編譯。出於簡單考慮，我們將 `split_at_mut` 實現為函數而不是方法，並只處理 `i32` 值而非泛型 `T` 的 slice。

```rust,ignore,does_not_compile
fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();

    assert!(mid <= len);

    (&mut slice[..mid],
     &mut slice[mid..])
}
```

<span class="caption">範例 19-5: 嘗試只使用安全 Rust 來實現 `split_at_mut`</span>

此函數首先獲取 slice 的長度，然後通過檢查參數是否小於或等於這個長度來斷言參數所給定的索引位於 slice 當中。該斷言意味著如果傳入的索引比要分割的 slice 的索引更大，此函數在嘗試使用這個索引前 panic。

之後我們在一個元組中返回兩個可變的 slice：一個從原始 slice 的開頭直到 `mid` 索引，另一個從 `mid` 直到原 slice 的結尾。

如果嘗試編譯範例 19-5 的代碼，會得到一個錯誤：

```text
error[E0499]: cannot borrow `*slice` as mutable more than once at a time
 -->
  |
6 |     (&mut slice[..mid],
  |           ----- first mutable borrow occurs here
7 |      &mut slice[mid..])
  |           ^^^^^ second mutable borrow occurs here
8 | }
  | - first borrow ends here
```

Rust 的借用檢查器不能理解我們要借用這個 slice 的兩個不同部分：它只知道我們借用了同一個 slice 兩次。本質上借用 slice 的不同部分是可以的，因為結果兩個 slice 不會重疊，不過 Rust 還沒有智慧到能夠理解這些。當我們知道某些事是可以的而 Rust 不知道的時候，就是觸及不安全代碼的時候了

範例 19-6 展示了如何使用 `unsafe` 塊，裸指針和一些不安全函數調用來實現 `split_at_mut`：

```rust,unsafe
use std::slice;

fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (slice::from_raw_parts_mut(ptr, mid),
         slice::from_raw_parts_mut(ptr.add(mid), len - mid))
    }
}
```

<span class="caption">範例 19-6: 在 `split_at_mut` 函數的實現中使用不安全代碼</span>

回憶第四章的 [“Slice 類型” ][the-slice-type] 部分，slice 是一個指向一些數據的指針，並帶有該 slice 的長度。可以使用 `len` 方法獲取 slice 的長度，使用 `as_mut_ptr` 方法訪問 slice 的裸指針。在這個例子中，因為有一個 `i32` 值的可變 slice，`as_mut_ptr` 返回一個 `*mut i32` 類型的裸指針，儲存在 `ptr` 變數中。

我們保持索引 `mid` 位於 slice 中的斷言。接著是不安全代碼：`slice::from_raw_parts_mut` 函數獲取一個裸指針和一個長度來創建一個 slice。這裡使用此函數從 `ptr` 中創建了一個有 `mid` 個項的 slice。之後在 `ptr` 上調用 `add` 方法並使用 `mid` 作為參數來獲取一個從 `mid` 開始的裸指針，使用這個裸指針並以 `mid` 之後項的數量為長度創建一個 slice。

`slice::from_raw_parts_mut` 函數是不安全的因為它獲取一個裸指針，並必須確信這個指針是有效的。裸指針上的 `add` 方法也是不安全的，因為其必須確信此地址偏移量也是有效的指針。因此必須將 `slice::from_raw_parts_mut` 和 `add` 放入 `unsafe` 塊中以便能調用它們。通過觀察代碼，和增加 `mid` 必然小於等於 `len` 的斷言，我們可以說 `unsafe` 塊中所有的裸指針將是有效的 slice 中數據的指針。這是一個可以接受的 `unsafe` 的恰當用法。

注意無需將 `split_at_mut` 函數的結果標記為 `unsafe`，並可以在安全 Rust 中調用此函數。我們創建了一個不安全代碼的安全抽象，其代碼以一種安全的方式使用了 `unsafe` 代碼，因為其只從這個函數訪問的數據中創建了有效的指針。

與此相對，範例 19-7 中的 `slice::from_raw_parts_mut` 在使用 slice 時很有可能會崩潰。這段代碼獲取任意記憶體地址並創建了一個長為一萬的 slice：

```rust,unsafe
use std::slice;

let address = 0x01234usize;
let r = address as *mut i32;

let slice: &[i32] = unsafe {
    slice::from_raw_parts_mut(r, 10000)
};
```

<span class="caption">範例 19-7: 透過任意記憶體地址創建 slice</span>

我們並不擁有這個任意地址的記憶體，也不能保證這段代碼創建的 slice 包含有效的 `i32` 值。試圖使用臆測為有效的 `slice` 會導致未定義的行為。

#### 使用 `extern` 函數調用外部代碼

有時你的 Rust 代碼可能需要與其他語言編寫的代碼交互。為此 Rust 有一個關鍵字，`extern`，有助於創建和使用 **外部函數介面**（*Foreign Function Interface*， FFI）。外部函數介面是一個程式語言用以定義函數的方式，其允許不同（外部）程式語言調用這些函數。

範例 19-8 展示了如何集成 C 標準庫中的 `abs` 函數。`extern` 塊中聲明的函數在 Rust 代碼中總是不安全的。因為其他語言不會強制執行 Rust 的規則且 Rust 無法檢查它們，所以確保其安全是程式設計師的責任：

<span class="filename">檔案名: src/main.rs</span>

```rust,unsafe
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

<span class="caption">範例 19-8: 聲明並調用另一個語言中定義的 `extern` 函數</span>

在 `extern "C"` 塊中，列出了我們希望能夠調用的另一個語言中的外部函數的簽名和名稱。`"C"` 部分定義了外部函數所使用的 **應用二進位制介面**（*application binary interface*，ABI） —— ABI 定義了如何在匯編語言層面調用此函數。`"C"` ABI 是最常見的，並遵循 C 程式語言的 ABI。

> #### 從其它語言調用 Rust 函數
>
> 也可以使用 `extern` 來創建一個允許其他語言調用 Rust 函數的介面。不同於 `extern` 塊，就在 `fn` 關鍵字之前增加 `extern` 關鍵字並指定所用到的 ABI。還需增加 `#[no_mangle]` 註解來告訴 Rust 編譯器不要 mangle 此函數的名稱。*Mangling* 發生於當編譯器將我們指定的函數名修改為不同的名稱時，這會增加用於其他編譯過程的額外訊息，不過會使其名稱更難以閱讀。每一個程式語言的編譯器都會以稍微不同的方式 mangle 函數名，所以為了使 Rust 函數能在其他語言中指定，必須禁用 Rust 編譯器的 name mangling。
>
> 在如下的例子中，一旦其編譯為動態庫並從 C 語言中連結，`call_from_c` 函數就能夠在 C 代碼中訪問：
>
> ```rust
> #[no_mangle]
> pub extern "C" fn call_from_c() {
>     println!("Just called a Rust function from C!");
> }
> ```
>
> `extern` 的使用無需 `unsafe`。

### 訪問或修改可變靜態變數

目前為止全書都儘量避免討論 **全局變數**（*global variables*），Rust 確實支持他們，不過這對於 Rust 的所有權規則來說是有問題的。如果有兩個執行緒訪問相同的可變全局變數，則可能會造成數據競爭。

全局變數在 Rust 中被稱為 **靜態**（*static*）變數。範例 19-9 展示了一個擁有字串 slice 值的靜態變數的聲明和應用：

<span class="filename">檔案名: src/main.rs</span>

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("name is: {}", HELLO_WORLD);
}
```

<span class="caption">範例 19-9: 定義和使用一個不可變靜態變數</span>

`static` 變數類似於第三章 [“變數和常量的區別”][differences-between-variables-and-constants]  部分討論的常量。通常靜態變數的名稱採用 `SCREAMING_SNAKE_CASE` 寫法，並 **必須** 標註變數的類型，在這個例子中是 `&'static str`。靜態變數只能儲存擁有 `'static` 生命週期的引用，這意味著 Rust 編譯器可以自己計算出其生命週期而無需顯式標註。訪問不可變靜態變數是安全的。

常量與不可變靜態變數可能看起來很類似，不過一個微妙的區別是靜態變數中的值有一個固定的記憶體地址。使用這個值總是會訪問相同的地址。另一方面，常量則允許在任何被用到的時候複製其數據。

常量與靜態變數的另一個區別在於靜態變數可以是可變的。訪問和修改可變靜態變數都是 **不安全** 的。範例 19-10 展示了如何聲明、訪問和修改名為 `COUNTER` 的可變靜態變數：

<span class="filename">檔案名: src/main.rs</span>

```rust,unsafe
static mut COUNTER: u32 = 0;

fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_count(3);

    unsafe {
        println!("COUNTER: {}", COUNTER);
    }
}
```

<span class="caption">範例 19-10: 讀取或修改一個可變靜態變數是不安全的</span>

就像常規變數一樣，我們使用 `mut` 關鍵來指定可變性。任何讀寫 `COUNTER` 的代碼都必須位於 `unsafe` 塊中。這段代碼可以編譯並如期列印出 `COUNTER: 3`，因為這是單執行緒的。擁有多個執行緒訪問 `COUNTER` 則可能導致數據競爭。

擁有可以全局訪問的可變數據，難以保證不存在數據競爭，這就是為何 Rust 認為可變靜態變數是不安全的。任何可能的情況，請優先使用第十六章討論的並發技術和執行緒安全智慧指針，這樣編譯器就能檢測不同執行緒間的數據訪問是否是安全的。

### 實現不安全 trait

最後一個只能用在 `unsafe` 中的操作是實現不安全 trait。當至少有一個方法中包含編譯器不能驗證的不變數時 trait 是不安全的。可以在 `trait` 之前增加 `unsafe` 關鍵字將 trait 聲明為 `unsafe`，同時 trait 的實現也必須標記為 `unsafe`，如範例 19-11 所示：

```rust,unsafe
unsafe trait Foo {
    // methods go here
}

unsafe impl Foo for i32 {
    // method implementations go here
}
```

<span class="caption">範例 19-11: 定義並實現不安全 trait</span>

通過 `unsafe impl`，我們承諾將保證編譯器所不能驗證的不變數。

作為一個例子，回憶第十六章 [“使用 `Sync` 和 `Send` trait 的可擴展並發”][extensible-concurrency-with-the-sync-and-send-traits]  部分中的 `Sync` 和 `Send` 標記 trait，編譯器會自動為完全由 `Send` 和 `Sync` 類型組成的類型自動實現他們。如果實現了一個包含一些不是 `Send` 或 `Sync` 的類型，比如裸指針，並希望將此類型標記為 `Send` 或 `Sync`，則必須使用 `unsafe`。Rust 不能驗證我們的類型保證可以安全的跨執行緒發送或在多執行緒間訪問，所以需要我們自己進行檢查並通過 `unsafe` 表明。

### 訪問聯合體中的欄位

`union` 和 `struct` 類似，但是在一個實例中同時只能使用一個聲明的欄位。聯合體主要用於和 C 代碼中的聯合體交互。訪問聯合體的欄位是不安全的，因為 Rust 無法保證當前存儲在聯合體實例中數據的類型。可以查看[參考文件][reference]了解有關聯合體的更多訊息。

### 何時使用不安全代碼

使用 `unsafe` 來進行這五個操作（超級力量）之一是沒有問題的，甚至是不需要深思熟慮的，不過使得 `unsafe` 代碼正確也實屬不易，因為編譯器不能幫助保證記憶體安全。當有理由使用 `unsafe` 代碼時，是可以這麼做的，透過使用顯式的 `unsafe` 標註使得在出現錯誤時易於追蹤問題的源頭。

[dangling-references]:
ch04-02-references-and-borrowing.html#dangling-references
[differences-between-variables-and-constants]:
ch03-01-variables-and-mutability.html#differences-between-variables-and-constants
[extensible-concurrency-with-the-sync-and-send-traits]:
ch16-04-extensible-concurrency-sync-and-send.html#extensible-concurrency-with-the-sync-and-send-traits
[the-slice-type]: ch04-03-slices.html#the-slice-type
[reference]: https://doc.rust-lang.org/reference/items/unions.html

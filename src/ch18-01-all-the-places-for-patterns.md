## 所有可能會用到模式的位置

> [ch18-01-all-the-places-for-patterns.md](https://github.com/rust-lang/book/blob/master/src/ch18-01-all-the-places-for-patterns.md)
> <br>
> commit 426f3e4ec17e539ae9905ba559411169d303a031

模式出現在 Rust 的很多地方。你已經在不經意間使用了很多模式！本部分是一個所有有效模式位置的參考。

### `match` 分支

如第六章所討論的，一個模式常用的位置是 `match` 表達式的分支。在形式上 `match` 表達式由 `match` 關鍵字、用於匹配的值和一個或多個分支構成，這些分支包含一個模式和在值匹配分支的模式時運行的表達式：

```text
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
}
```

`match` 表達式必須是 **窮盡**（*exhaustive*）的，意為 `match` 表達式所有可能的值都必須被考慮到。一個確保覆蓋每個可能值的方法是在最後一個分支使用捕獲所有的模式：比如，一個匹配任何值的名稱永遠也不會失敗，因此可以覆蓋所有匹配剩下的情況。

有一個特定的模式 `_` 可以匹配所有情況，不過它從不綁定任何變數。這在例如希望忽略任何未指定值的情況很有用。本章之後的 [“忽略模式中的值”][ignoring-values-in-a-pattern]  部分會詳細介紹 `_` 模式的更多細節。

### `if let` 條件表達式

第六章討論過了 `if let` 表達式，以及它是如何主要用於編寫等同於只關心一個情況的 `match` 語句簡寫的。`if let` 可以對應一個可選的帶有代碼的 `else` 在 `if let` 中的模式不匹配時運行。

範例 18-1 展示了也可以組合併匹配 `if let`、`else if` 和 `else if let` 表達式。這相比 `match` 表達式一次只能將一個值與模式比較提供了更多靈活性；一系列 `if let`、`else if`、`else if let` 分支並不要求其條件相互關聯。

範例 18-1 中的代碼展示了一系列針對不同條件的檢查來決定背景顏色應該是什麼。為了達到這個例子的目的，我們創建了寫死值的變數，在真實程序中則可能由詢問用戶獲得。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("Using your favorite color, {}, as the background", color);
    } else if is_tuesday {
        println!("Tuesday is green day!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("Using purple as the background color");
        } else {
            println!("Using orange as the background color");
        }
    } else {
        println!("Using blue as the background color");
    }
}
```

<span class="caption">範例 18-1: 結合 `if let`、`else if`、`else if let` 以及 `else`</span>

如果用戶指定了中意的顏色，將使用其作為背景顏色。如果今天是星期二，背景顏色將是綠色。如果用戶指定了他們的年齡字串並能夠成功將其解析為數字的話，我們將根據這個數字使用紫色或者橙色。最後，如果沒有一個條件符合，背景顏色將是藍色：

這個條件結構允許我們支持複雜的需求。使用這裡寫死的值，例子會列印出 `Using purple as the background color`。

注意 `if let` 也可以像 `match` 分支那樣引入覆蓋變數：`if let Ok(age) = age` 引入了一個新的覆蓋變數 `age`，它包含 `Ok` 成員中的值。這意味著 `if age > 30` 條件需要位於這個代碼塊內部；不能將兩個條件組合為 `if let Ok(age) = age && age > 30`，因為我們希望與 30 進行比較的被覆蓋的 `age` 直到大括號開始的新作用域才是有效的。

`if let` 表達式的缺點在於其窮盡性沒有為編譯器所檢查，而 `match` 表達式則檢查了。如果去掉最後的 `else` 塊而遺漏處理一些情況，編譯器也不會警告這類可能的邏輯錯誤。

### `while let` 條件循環

一個與 `if let` 結構類似的是 `while let` 條件循環，它允許只要模式匹配就一直進行 `while` 循環。範例 18-2 展示了一個使用 `while let` 的例子，它使用 vector 作為棧並以先進後出的方式列印出 vector 中的值：

```rust
let mut stack = Vec::new();

stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

<span class="caption">列表 18-2: 使用 `while let` 循環只要 `stack.pop()` 返回 `Some` 就列印出其值</span>

這個例子會列印出 3、2 接著是 1。`pop` 方法取出 vector 的最後一個元素並返回 `Some(value)`。如果 vector 是空的，它返回 `None`。`while` 循環只要 `pop` 返回 `Some` 就會一直運行其塊中的代碼。一旦其返回 `None`，`while` 循環停止。我們可以使用 `while let` 來彈出棧中的每一個元素。

### `for` 循環

如同第三章所講的，`for` 循環是 Rust 中最常見的循環結構，不過還沒有講到的是 `for` 可以獲取一個模式。在 `for` 循環中，模式是 `for` 關鍵字直接跟隨的值，正如 `for x in y` 中的 `x`。

範例 18-3 中展示了如何使用 `for` 循環來解構，或拆開一個元組作為 `for` 循環的一部分：

```rust
let v = vec!['a', 'b', 'c'];

for (index, value) in v.iter().enumerate() {
    println!("{} is at index {}", value, index);
}
```

<span class="caption">列表 18-3: 在 `for` 循環中使用模式來解構元組</span>

範例 18-3 的代碼會列印出：

```text
a is at index 0
b is at index 1
c is at index 2
```

這裡使用 `enumerate` 方法適配一個疊代器來產生一個值和其在疊代器中的索引，他們位於一個元組中。第一個 `enumerate` 調用會產生元組 `(0, 'a')`。當這個值匹配模式 `(index, value)`，`index` 將會是 0 而 `value` 將會是  `'a'`，並列印出第一行輸出。

### `let` 語句

在本章之前，我們只明確的討論過通過 `match` 和 `if let` 使用模式，不過事實上也在別地地方使用過模式，包括 `let` 語句。例如，考慮一下這個直接的 `let` 變數賦值：

```rust
let x = 5;
```

本書進行了不下百次這樣的操作，不過你可能沒有發覺，這正是在使用模式！`let` 語句更為正式的樣子如下：

```text
let PATTERN = EXPRESSION;
```

像 `let x = 5;` 這樣的語句中變數名位於 `PATTERN` 位置，變數名不過是形式特別樸素的模式。我們將表達式與模式比較，並為任何找到的名稱賦值。所以例如 `let x = 5;` 的情況，`x` 是一個模式代表 “將匹配到的值綁定到變數 x”。同時因為名稱 `x` 是整個模式，這個模式實際上等於 “將任何值綁定到變數 `x`，不管值是什麼”。

為了更清楚的理解 `let` 的模式匹配方面的內容，考慮範例 18-4 中使用 `let` 和模式解構一個元組：

```rust
let (x, y, z) = (1, 2, 3);
```

<span class="caption">範例 18-4: 使用模式解構元組並一次創建三個變數</span>

這裡將一個元組與模式匹配。Rust 會比較值 `(1, 2, 3)` 與模式 `(x, y, z)` 並發現此值匹配這個模式。在這個例子中，將會把 `1` 綁定到 `x`，`2` 綁定到 `y` 並將 `3` 綁定到 `z`。你可以將這個元組模式看作是將三個獨立的變數模式結合在一起。

如果模式中元素的數量不匹配元組中元素的數量，則整個類型不匹配，並會得到一個編譯時錯誤。例如，範例 18-5 展示了嘗試用兩個變數解構三個元素的元組，這是不行的：

```rust,ignore,does_not_compile
let (x, y) = (1, 2, 3);
```

<span class="caption">範例 18-5: 一個錯誤的模式結構，其中變數的數量不符合元組中元素的數量</span>

嘗試編譯這段代碼會給出如下類型錯誤：

```text
error[E0308]: mismatched types
 --> src/main.rs:2:9
  |
2 |     let (x, y) = (1, 2, 3);
  |         ^^^^^^ expected a tuple with 3 elements, found one with 2 elements
  |
  = note: expected type `({integer}, {integer}, {integer})`
             found type `(_, _)`
```

如果希望忽略元組中一個或多個值，也可以使用 `_` 或 `..`，如 [“忽略模式中的值”][ignoring-values-in-a-pattern]  部分所示。如果問題是模式中有太多的變數，則解決方法是通過去掉變數使得變數數與元組中元素數相等。

### 函數參數

函數參數也可以是模式。列表 18-6 中的代碼聲明了一個叫做 `foo` 的函數，它獲取一個 `i32` 類型的參數 `x`，現在這看起來應該很熟悉：

```rust
fn foo(x: i32) {
    // 代碼
}
```

<span class="caption">列表 18-6: 在參數中使用模式的函數簽名</span>

`x` 部分就是一個模式！類似於之前對 `let` 所做的，可以在函數參數中匹配元組。列表 18-7 將傳遞給函數的元組拆分為值：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({}, {})", x, y);
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
```

<span class="caption">列表 18-7: 一個在參數中解構元組的函數</span>

這會列印出 `Current location: (3, 5)`。值 `&(3, 5)` 會匹配模式 `&(x, y)`，如此 `x` 得到了值 `3`，而 `y`得到了值 `5`。

因為如第十三章所講閉包類似於函數，也可以在閉包參數列表中使用模式。

現在我們見過了很多使用模式的方式了，不過模式在每個使用它的地方並不以相同的方式工作；在一些地方，模式必須是 *irrefutable* 的，意味著他們必須匹配所提供的任何值。在另一些情況，他們則可以是 refutable 的。接下來讓我們討論這兩個概念。

[ignoring-values-in-a-pattern]:
ch18-03-pattern-syntax.html#ignoring-values-in-a-pattern

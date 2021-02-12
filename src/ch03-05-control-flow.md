## 控制流

> [ch03-05-control-flow.md](https://github.com/rust-lang/book/blob/master/src/ch03-05-control-flow.md)
> <br>
> commit af34ac954a6bd7fc4a8bbcc5c9685e23c5af87da

根據條件是否為真來決定是否執行某些程式碼，以及根據條件是否為真來重複運行一段代碼是大部分程式語言的基本組成部分。Rust 代碼中最常見的用來控制執行流的結構是 `if` 表達式和循環。

### `if` 表達式

`if` 表達式允許根據條件執行不同的代碼分支。你提供一個條件並表示 “如果條件滿足，運行這段代碼；如果條件不滿足，不運行這段代碼。”

在 *projects* 目錄新建一個叫做 *branches* 的項目，來學習 `if` 表達式。在 *src/main.rs* 文件中，輸入如下內容：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

<!-- NEXT PARAGRAPH WRAPPED WEIRD INTENTIONALLY SEE #199 -->

所有的 `if` 表達式都以 `if` 關鍵字開頭，其後跟一個條件。在這個例子中，條件檢查變數 `number` 的值是否小於 5。在條件為真時希望執行的代碼塊位於緊跟條件之後的大括號中。`if` 表達式中與條件關聯的代碼塊有時被叫做 *arms*，就像第二章 [“比較猜測的數字和秘密數字”][comparing-the-guess-to-the-secret-number] 部分中討論到的 `match` 表達式中的分支一樣。

也可以包含一個可選的 `else` 表達式來提供一個在條件為假時應當執行的代碼塊，這裡我們就這麼做了。如果不提供 `else` 表達式並且條件為假時，程序會直接忽略 `if` 代碼塊並繼續執行下面的代碼。

嘗試運行程式碼，應該能看到如下輸出：

```text
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/branches`
condition was true
```

嘗試改變 `number` 的值使條件為 `false` 時看看會發生什麼事：

```rust,ignore
let number = 7;
```

再次運行程序並查看輸出：

```text
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/branches`
condition was false
```

另外值得注意的是代碼中的條件 **必須** 是 `bool` 值。如果條件不是 `bool` 值，我們將得到一個錯誤。例如，嘗試運行以下代碼：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let number = 3;

    if number {
        println!("number was three");
    }
}
```

這裡 `if` 條件的值是 `3`，Rust 拋出了一個錯誤：

```text
error[E0308]: mismatched types
 --> src/main.rs:4:8
  |
4 |     if number {
  |        ^^^^^^ expected bool, found integer
  |
  = note: expected type `bool`
             found type `{integer}`
```

這個錯誤表明 Rust 期望一個 `bool` 卻得到了一個整數。不像 Ruby 或 JavaScript 這樣的語言，Rust 並不會嘗試自動地將非布爾值轉換為布爾值。必須總是顯式地使用布爾值作為 `if` 的條件。例如，如果想要 `if` 代碼塊只在一個數字不等於 `0` 時執行，可以把 `if` 表達式修改成下面這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

運行程式碼會列印出 `number was something other than zero`。

#### 使用 `else if` 處理多重條件

可以將 `else if` 表達式與 `if` 和 `else` 組合來實現多重條件。例如：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}
```

這個程序有四個可能的執行路徑。運行後應該能看到如下輸出：

```text
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31 secs
     Running `target/debug/branches`
number is divisible by 3
```

當執行這個程序時，它按順序檢查每個 `if` 表達式並執行第一個條件為真的代碼塊。注意即使 6 可以被 2 整除，也不會輸出 `number is divisible by 2`，更不會輸出 `else` 塊中的 `number is not divisible by 4, 3, or 2`。原因是 Rust 只會執行第一個條件為真的代碼塊，並且一旦它找到一個以後，甚至都不會檢查剩下的條件了。

使用過多的 `else if` 表達式會使代碼顯得雜亂無章，所以如果有多於一個 `else if` 表達式，最好重構代碼。為此，第六章會介紹一個強大的 Rust 分支結構（branching construct），叫做 `match`。

#### 在 `let` 語句中使用 `if`

因為 `if` 是一個表達式，我們可以在 `let` 語句的右側使用它，例如在範例 3-2 中：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let condition = true;
    let number = if condition {
        5
    } else {
        6
    };

    println!("The value of number is: {}", number);
}
```

<span class="caption">範例 3-2：將 `if` 表達式的返回值賦給一個變數</span>

`number` 變數將會綁定到表示 `if` 表達式結果的值上。運行這段代碼看看會出現什麼：

```text
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30 secs
     Running `target/debug/branches`
The value of number is: 5
```

記住，代碼塊的值是其最後一個表達式的值，而數字本身就是一個表達式。在這個例子中，整個 `if` 表達式的值取決於哪個代碼塊被執行。這意味著 `if` 的每個分支的可能的返回值都必須是相同類型；在範例 3-2 中，`if` 分支和 `else` 分支的結果都是 `i32` 整型。如果它們的類型不匹配，如下面這個例子，則會出現一個錯誤：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore,does_not_compile
fn main() {
    let condition = true;

    let number = if condition {
        5
    } else {
        "six"
    };

    println!("The value of number is: {}", number);
}
```

當編譯這段代碼時，會得到一個錯誤。`if` 和 `else` 分支的值類型是不相容的，同時 Rust 也準確地指出在程序中的何處發現的這個問題：

```text
error[E0308]: if and else have incompatible types
 --> src/main.rs:4:18
  |
4 |       let number = if condition {
  |  __________________^
5 | |         5
6 | |     } else {
7 | |         "six"
8 | |     };
  | |_____^ expected integer, found &str
  |
  = note: expected type `{integer}`
             found type `&str`
```

`if` 代碼塊中的表達式返回一個整數，而 `else` 代碼塊中的表達式返回一個字串。這不可行，因為變數必須只有一個類型。Rust 需要在編譯時就確切的知道 `number` 變數的類型，這樣它就可以在編譯時驗證在每處使用的 `number` 變數的類型是有效的。Rust 並不能夠在 `number` 的類型只能在運行時確定的情況下工作；這樣會使編譯器變得更複雜而且只能為代碼提供更少的保障，因為它不得不記錄所有變數的多種可能的類型。

### 使用循環重複執行

多次執行同一段代碼是很常用的，Rust 為此提供了多種 **循環**（*loops*）。一個循環執行循環體中的代碼直到結尾並緊接著回到開頭繼續執行。為了實驗一下循環，讓我們新建一個叫做 *loops* 的項目。

Rust 有三種循環：`loop`、`while` 和 `for`。我們每一個都試試。

#### 使用 `loop` 重複執行程式碼

`loop` 關鍵字告訴 Rust 一遍又一遍地執行一段代碼直到你明確要求停止。

作為一個例子，將 *loops* 目錄中的 *src/main.rs* 文件修改為如下：

<span class="filename">檔案名: src/main.rs</span>

```rust,ignore
fn main() {
    loop {
        println!("again!");
    }
}
```

當運行這個程序時，我們會看到連續的反覆列印 `again!`，直到我們手動停止程式。大部分終端都支持一個快捷鍵，<span class="keystroke">ctrl-c</span>，來終止一個陷入無限循環的程序。嘗試一下：

```text
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished dev [unoptimized + debuginfo] target(s) in 0.29 secs
     Running `target/debug/loops`
again!
again!
again!
again!
^Cagain!
```

符號 `^C` 代表你在這按下了<span class="keystroke">ctrl-c</span>。在 `^C` 之後你可能看到也可能看不到 `again!` ，這取決於在接收到終止信號時代碼執行到了循環的何處。

幸運的是，Rust 提供了另一種更可靠的退出循環的方式。可以使用 `break` 關鍵字來告訴程序何時停止循環。回憶一下在第二章猜猜看遊戲的 [“猜測正確後退出”][quitting-after-a-correct-guess] 部分使用過它來在用戶猜對數字贏得遊戲後退出程序。

#### 從循環返回

`loop` 的一個用例是重試可能會失敗的操作，比如檢查執行緒是否完成了任務。然而你可能會需要將操作的結果傳遞給其它的代碼。如果將返回值加入你用來停止循環的 `break` 表達式，它會被停止的循環返回：

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {}", result);
}
```

在循環之前，我們聲明了一個名為 `counter` 的變數並初始化為 `0`。接著聲明了一個名為 `result` 來存放循環的返回值。在循環的每一次疊代中，我們將 `counter` 變數加 `1`，接著檢查計數是否等於 `10`。當相等時，使用 `break` 關鍵字返回值 `counter * 2`。循環之後，我們透過分號結束賦值給 `result` 的語句。最後列印出 `result` 的值，也就是 20。

#### `while` 條件循環

在程序中計算循環的條件也很常見。當條件為真，執行循環。當條件不再為真，調用 `break` 停止循環。這個循環類型可以通過組合 `loop`、`if`、`else` 和 `break` 來實現；如果你喜歡的話，現在就可以在程序中試試。

然而，這個模式太常用了，Rust 為此內建了一個語言結構，它被稱為 `while` 循環。範例 3-3 使用了 `while`：程序循環三次，每次數字都減一。接著，在循環結束後，列印出另一個訊息並退出。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{}!", number);

        number = number - 1;
    }

    println!("LIFTOFF!!!");
}
```

<span class="caption">範例 3-3: 當條件為真時，使用 `while` 循環運行程式碼</span>

這種結構消除了很多使用 `loop`、`if`、`else` 和 `break` 時所必須的嵌套，這樣更加清晰。當條件為真就執行，否則退出循環。

#### 使用 `for` 遍歷集合

可以使用 `while` 結構來遍歷集合中的元素，比如數組。例如，看看範例 3-4。

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];
    let mut index = 0;

    while index < 5 {
        println!("the value is: {}", a[index]);

        index = index + 1;
    }
}
```

<span class="caption">範例 3-4：使用 `while` 循環遍歷集合中的元素</span>

這裡，代碼對數組中的元素進行計數。它從索引 `0` 開始，並接著循環直到遇到數組的最後一個索引（這時，`index < 5` 不再為真）。運行這段代碼會列印出數組中的每一個元素：

```text
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
     Running `target/debug/loops`
the value is: 10
the value is: 20
the value is: 30
the value is: 40
the value is: 50
```

數組中的所有五個元素都如期被列印出來。儘管 `index` 在某一時刻會到達值 `5`，不過循環在其嘗試從數組獲取第六個值（會越界）之前就停止了。

但這個過程很容易出錯；如果索引長度不正確會導致程序 panic。這也使程序更慢，因為編譯器增加了運行時代碼來對每次循環的每個元素進行條件檢查。

作為更簡潔的替代方案，可以使用 `for` 循環來對一個集合的每個元素執行一些程式碼。`for` 循環看起來如範例 3-5 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a.iter() {
        println!("the value is: {}", element);
    }
}
```

<span class="caption">範例 3-5：使用 `for` 循環遍歷集合中的元素</span>

當運行這段代碼時，將看到與範例 3-4 一樣的輸出。更為重要的是，我們增強了代碼安全性，並消除了可能由於超出數組的結尾或遍歷長度不夠而缺少一些元素而導致的 bug。

例如，在範例 3-4 的代碼中，如果從數組 `a` 中移除一個元素但忘記將條件更新為 `while index < 4`，代碼將會 panic。使用 `for` 循環的話，就不需要惦記著在改變數組元素個數時修改其他的代碼了。

`for` 循環的安全性和簡潔性使得它成為 Rust 中使用最多的循環結構。即使是在想要循環執行程式碼特定次數時，例如範例 3-3 中使用 `while` 循環的倒數計時例子，大部分 Rustacean 也會使用 `for` 循環。這麼做的方式是使用 `Range`，它是標準庫提供的類型，用來生成從一個數字開始到另一個數字之前結束的所有數字的序列。

下面是一個使用 `for` 循環來倒數計時的例子，它還使用了一個我們還未講到的方法，`rev`，用來反轉 range：

<span class="filename">檔案名: src/main.rs</span>

```rust
fn main() {
    for number in (1..4).rev() {
        println!("{}!", number);
    }
    println!("LIFTOFF!!!");
}
```

這段代碼看起來更帥氣不是嗎？

## 總結

你做到了！這是一個大章節：你學習了變數、標量和複合數據類型、函數、注釋、 `if` 表達式和循環！如果你想要實踐本章討論的概念，嘗試構建如下程序：

* 相互轉換攝氏與華氏溫度。
* 生成 n 階斐波那契數列。
* 列印聖誕頌歌 “The Twelve Days of Christmas” 的歌詞，並利用歌曲中的重複部分（編寫循環）。

當你準備好繼續的時候，讓我們討論一個其他語言中 **並不** 常見的概念：所有權（ownership）。

[comparing-the-guess-to-the-secret-number]:
ch02-00-guessing-game-tutorial.html#comparing-the-guess-to-the-secret-number
[quitting-after-a-correct-guess]:
ch02-00-guessing-game-tutorial.html#quitting-after-a-correct-guess

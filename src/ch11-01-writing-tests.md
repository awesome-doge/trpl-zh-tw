## 如何編寫測試

> [ch11-01-writing-tests.md](https://github.com/rust-lang/book/blob/master/src/ch11-01-writing-tests.md)
> <br>
> commit cc6a1ef2614aa94003566027b285b249ccf961fa

Rust 中的測試函數是用來驗證非測試代碼是否按照期望的方式運行的。測試函數體通常執行如下三種操作：

1. 設置任何所需的數據或狀態
2. 運行需要測試的代碼
3. 斷言其結果是我們所期望的

讓我們看看 Rust 提供的專門用來編寫測試的功能：`test` 屬性、一些宏和 `should_panic` 屬性。

### 測試函數剖析

作為最簡單例子，Rust 中的測試就是一個帶有 `test` 屬性註解的函數。屬性（attribute）是關於 Rust 代碼片段的元數據；第五章中結構體中用到的 `derive` 屬性就是一個例子。為了將一個函數變成測試函數，需要在 `fn` 行之前加上 `#[test]`。當使用 `cargo test` 命令運行測試時，Rust 會構建一個測試執行程序用來調用標記了 `test` 屬性的函數，並報告每一個測試是通過還是失敗。

第七章當使用 Cargo 新建一個庫項目時，它會自動為我們生成一個測試模組和一個測試函數。這有助於我們開始編寫測試，因為這樣每次開始新項目時不必去查找測試函數的具體結構和語法了。當然你也可以額外增加任意多的測試函數以及測試模組！

我們會通過實驗那些自動生成的測試模版而不是實際編寫測試代碼來探索測試如何工作的一些方面。接著，我們會寫一些真正的測試，調用我們編寫的代碼並斷言他們的行為的正確性。

讓我們創建一個新的庫項目 `adder`：

```text
$ cargo new adder --lib
     Created library `adder` project
$ cd adder
```

adder 庫中 `src/lib.rs` 的內容應該看起來如範例 11-1 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

<span class="caption">範例 11-1：由 `cargo new` 自動生成的測試模組和函數</span>

現在讓我們暫時忽略 `tests` 模組和 `#[cfg(test)]` 註解，並只關注函數來了解其如何工作。注意 `fn` 行之前的 `#[test]`：這個屬性表明這是一個測試函數，這樣測試執行者就知道將其作為測試處理。因為也可以在 `tests` 模組中擁有非測試的函數來幫助我們建立通用場景或進行常見操作，所以需要使用 `#[test]` 屬性標明哪些函數是測試。

函數體透過使用 `assert_eq!` 宏來斷言 2 加 2 等於 4。一個典型的測試的格式，就是像這個例子中的斷言一樣。接下來運行就可以看到測試通過。

`cargo test` 命令會運行項目中所有的測試，如範例 11-2 所示：

```text
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 0.22 secs
     Running target/debug/deps/adder-ce99bcc2479f4607

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

<span class="caption">範例 11-2：運行自動生成測試的輸出</span>

Cargo 編譯並運行了測試。在 `Compiling`、`Finished` 和 `Running` 這幾行之後，可以看到 `running 1 test` 這一行。下一行顯示了生成的測試函數的名稱，它是 `it_works`，以及測試的運行結果，`ok`。接著可以看到全體測試運行結果的摘要：`test result: ok.` 意味著所有測試都通過了。`1 passed; 0 failed` 表示通過或失敗的測試數量。

因為之前我們並沒有將任何測試標記為忽略，所以摘要中會顯示 `0 ignored`。我們也沒有過濾需要運行的測試，所以摘要中會顯示`0 filtered out`。在下一部分 [“控制測試如何運行”][controlling-how-tests-are-run] 會討論忽略和過濾測試。

`0 measured` 統計是針對性能測試的。性能測試（benchmark tests）在編寫本書時，仍只能用於 Rust 開發版（nightly Rust）。請查看 [性能測試的文件][bench] 了解更多。

[bench]: https://doc.rust-lang.org/unstable-book/library-features/test.html

測試輸出中的以 `Doc-tests adder` 開頭的這一部分是所有文件測試的結果。我們現在並沒有任何文件測試，不過 Rust 會編譯任何在 API 文件中的代碼範例。這個功能幫助我們使文件和代碼保持同步！在第十四章的 [“文件注釋作為測試”][doc-comments] 部分會講到如何編寫文件測試。現在我們將忽略 `Doc-tests` 部分的輸出。

讓我們改變測試的名稱並看看這如何改變測試的輸出。給 `it_works` 函數取個不同的名字，比如 `exploration`，像這樣：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
#[cfg(test)]
mod tests {
    #[test]
    fn exploration() {
        assert_eq!(2 + 2, 4);
    }
}
```

並再次運行 `cargo test`。現在輸出中將出現 `exploration` 而不是 `it_works`：

```text
running 1 test
test tests::exploration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

讓我們增加另一個測試，不過這一次是一個會失敗的測試！當測試函數中出現 panic 時測試就失敗了。每一個測試都在一個新執行緒中運行，當主執行緒發現測試執行緒異常了，就將對應測試標記為失敗。第九章講到了最簡單的造成 panic 的方法：調用 `panic!` 宏。寫入新測試 `another` 後， `src/lib.rs` 現在看起來如範例 11-3 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust,panics
# fn main() {}
#[cfg(test)]
mod tests {
    #[test]
    fn exploration() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }
}
```

<span class="caption">範例 11-3：增加第二個因調用了 `panic!` 而失敗的測試</span>

再次 `cargo test` 運行測試。輸出應該看起來像範例 11-4，它表明 `exploration` 測試通過了而 `another` 失敗了：

```text
running 2 tests
test tests::exploration ... ok
test tests::another ... FAILED

failures:

---- tests::another stdout ----
thread 'tests::another' panicked at 'Make this test fail', src/lib.rs:10:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.

failures:
    tests::another

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out

error: test failed
```

<span class="caption">範例 11-4：一個測試通過和一個測試失敗的測試結果</span>

`test tests::another` 這一行是 `FAILED` 而不是 `ok` 了。在單獨測試結果和摘要之間多了兩個新的部分：第一個部分顯示了測試失敗的詳細原因。在這個例子中，`another` 因為在*src/lib.rs* 的第 10 行 `panicked at 'Make this test fail'` 而失敗。下一部分列出了所有失敗的測試，這在有很多測試和很多失敗測試的詳細輸出時很有幫助。我們可以透過使用失敗測試的名稱來只運行這個測試，以便除錯；下一部分 [“控制測試如何運行”][controlling-how-tests-are-run] 會講到更多運行測試的方法。

最後是摘要行：總體上講，測試結果是 `FAILED`。有一個測試通過和一個測試失敗。

現在我們見過不同場景中測試結果是什麼樣子的了，再來看看除 `panic!` 之外的一些在測試中有幫助的宏吧。

### 使用 `assert!` 宏來檢查結果

`assert!` 宏由標準庫提供，在希望確保測試中一些條件為 `true` 時非常有用。需要向 `assert!` 宏提供一個求值為布爾值的參數。如果值是 `true`，`assert!` 什麼也不做，同時測試會通過。如果值為 `false`，`assert!` 調用 `panic!` 宏，這會導致測試失敗。`assert!` 宏幫助我們檢查代碼是否以期望的方式運行。

回憶一下第五章中，範例 5-15 中有一個 `Rectangle` 結構體和一個 `can_hold` 方法，在範例 11-5 中再次使用他們。將他們放進 *src/lib.rs* 並使用 `assert!` 宏編寫一些測試。

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

<span class="caption">範例 11-5：第五章中 `Rectangle` 結構體和其 `can_hold` 方法</span>

`can_hold` 方法返回一個布爾值，這意味著它完美符合 `assert!` 宏的使用場景。在範例 11-6 中，讓我們編寫一個 `can_hold` 方法的測試來作為練習，這裡創建一個長為 8 寬為 7 的 `Rectangle` 實例，並假設它可以放得下另一個長為 5 寬為 1 的 `Rectangle` 實例：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle { width: 8, height: 7 };
        let smaller = Rectangle { width: 5, height: 1 };

        assert!(larger.can_hold(&smaller));
    }
}
```

<span class="caption">範例 11-6：一個 `can_hold` 的測試，檢查一個較大的矩形確實能放得下一個較小的矩形</span>

注意在 `tests` 模組中新增加了一行：`use super::*;`。`tests` 是一個普通的模組，它遵循第七章 [“路徑用於引用模組樹中的項”][paths-for-referring-to-an-item-in-the-module-tree] 部分介紹的可見性規則。因為這是一個內部模組，要測試外部模組中的代碼，需要將其引入到內部模組的作用域中。這裡選擇使用 glob 全局導入，以便在 `tests` 模組中使用所有在外部模組定義的內容。

我們將測試命名為 `larger_can_hold_smaller`，並創建所需的兩個 `Rectangle` 實例。接著調用 `assert!` 宏並傳遞 `larger.can_hold(&smaller)` 調用的結果作為參數。這個表達式預期會返回 `true`，所以測試應該通過。讓我們拭目以待！

```text
running 1 test
test tests::larger_can_hold_smaller ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

它確實通過了！再來增加另一個測試，這一回斷言一個更小的矩形不能放下一個更大的矩形：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        // --snip--
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle { width: 8, height: 7 };
        let smaller = Rectangle { width: 5, height: 1 };

        assert!(!smaller.can_hold(&larger));
    }
}
```

因為這裡 `can_hold` 函數的正確結果是 `false` ，我們需要將這個結果取反後傳遞給 `assert!` 宏。因此 `can_hold` 返回 `false` 時測試就會通過：

```text
running 2 tests
test tests::smaller_cannot_hold_larger ... ok
test tests::larger_can_hold_smaller ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

兩個通過的測試！現在讓我們看看如果引入一個 bug 的話測試結果會發生什麼事。將 `can_hold` 方法中比較長度時本應使用大於號的地方改成小於號：

```rust,not_desired_behavior
# fn main() {}
# #[derive(Debug)]
# struct Rectangle {
#     width: u32,
#     height: u32,
# }
// --snip--

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width < other.width && self.height > other.height
    }
}
```

現在運行測試會產生：

```text
running 2 tests
test tests::smaller_cannot_hold_larger ... ok
test tests::larger_can_hold_smaller ... FAILED

failures:

---- tests::larger_can_hold_smaller stdout ----
thread 'tests::larger_can_hold_smaller' panicked at 'assertion failed:
larger.can_hold(&smaller)', src/lib.rs:22:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.

failures:
    tests::larger_can_hold_smaller

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

我們的測試捕獲了 bug！因為 `larger.length` 是 8 而 `smaller.length` 是 5，`can_hold` 中的長度比較現在因為 8 不小於 5 而返回 `false`。

### 使用 `assert_eq!` 和 `assert_ne!` 宏來測試相等

測試功能的一個常用方法是將需要測試代碼的值與期望值做比較，並檢查是否相等。可以通過向 `assert!` 宏傳遞一個使用 `==` 運算符的表達式來做到。不過這個操作實在是太常見了，以至於標準庫提供了一對宏來更方便的處理這些操作 —— `assert_eq!` 和 `assert_ne!`。這兩個宏分別比較兩個值是相等還是不相等。當斷言失敗時他們也會列印出這兩個值具體是什麼，以便於觀察測試 **為什麼** 失敗，而 `assert!` 只會列印出它從 `==` 表達式中得到了 `false` 值，而不是導致 `false` 的兩個值。

範例 11-7 中，讓我們編寫一個對其參數加二並返回結果的函數 `add_two`。接著使用 `assert_eq!` 宏測試這個函數。

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
pub fn add_two(a: i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }
}
```

<span class="caption">範例 11-7：使用 `assert_eq!` 宏測試 `add_two` 函數</span>

測試通過了！

```text
running 1 test
test tests::it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

傳遞給 `assert_eq!` 宏的第一個參數 `4` ，等於調用 `add_two(2)` 的結果。測試中的這一行 `test tests::it_adds_two ... ok` 中 `ok` 表明測試通過！

在代碼中引入一個 bug 來看看使用 `assert_eq!` 的測試失敗是什麼樣的。修改 `add_two` 函數的實現使其加 3：

```rust,not_desired_behavior
# fn main() {}
pub fn add_two(a: i32) -> i32 {
    a + 3
}
```

再次運行測試：

```text
running 1 test
test tests::it_adds_two ... FAILED

failures:

---- tests::it_adds_two stdout ----
thread 'tests::it_adds_two' panicked at 'assertion failed: `(left == right)`
  left: `4`,
 right: `5`', src/lib.rs:11:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.

failures:
    tests::it_adds_two

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

測試捕獲到了 bug！`it_adds_two` 測試失敗，顯示訊息 `` assertion failed: `(left == right)` `` 並表明 `left` 是 `4` 而 `right` 是 `5`。這個訊息有助於我們開始除錯：它說 `assert_eq!` 的 `left` 參數是 `4`，而 `right` 參數，也就是 `add_two(2)` 的結果，是 `5`。

需要注意的是，在一些語言和測試框架中，斷言兩個值相等的函數的參數叫做 `expected` 和 `actual`，而且指定參數的順序是很關鍵的。然而在 Rust 中，他們則叫做 `left` 和 `right`，同時指定期望的值和被測試代碼產生的值的順序並不重要。這個測試中的斷言也可以寫成 `assert_eq!(add_two(2), 4)`，這時失敗訊息會變成 `` assertion failed: `(left == right)` `` 其中 `left` 是 `5` 而 `right` 是 `4`。

`assert_ne!` 宏在傳遞給它的兩個值不相等時通過，而在相等時失敗。在代碼按預期運行，我們不確定值 **會** 是什麼，不過能確定值絕對 **不會** 是什麼的時候，這個宏最有用處。例如，如果一個函數保證會以某種方式改變其輸出，不過這種改變方式是由運行測試時是星期幾來決定的，這時最好的斷言可能就是函數的輸出不等於其輸入。

`assert_eq!` 和 `assert_ne!` 宏在底層分別使用了 `==` 和 `!=`。當斷言失敗時，這些宏會使用除錯格式列印出其參數，這意味著被比較的值必需實現了 `PartialEq` 和 `Debug` trait。所有的基本類型和大部分標準庫類型都實現了這些 trait。對於自訂的結構體和枚舉，需要實現 `PartialEq` 才能斷言他們的值是否相等。需要實現 `Debug` 才能在斷言失敗時列印他們的值。因為這兩個 trait 都是派生 trait，如第五章範例 5-12 所提到的，通常可以直接在結構體或枚舉上添加 `#[derive(PartialEq, Debug)]` 註解。附錄 C [“可派生 trait”][derivable-traits] 中有更多關於這些和其他派生 trait 的詳細訊息。

### 自訂失敗訊息

你也可以向 `assert!`、`assert_eq!` 和 `assert_ne!` 宏傳遞一個可選的失敗訊息參數，可以在測試失敗時將自訂失敗訊息一同列印出來。任何在 `assert!` 的一個必需參數和 `assert_eq!` 和 `assert_ne!` 的兩個必需參數之後指定的參數都會傳遞給 `format!` 宏（在第八章的 [“使用 `+` 運算符或 `format!` 宏拼接字串”][concatenation-with-the--operator-or-the-format-macro] 部分討論過），所以可以傳遞一個包含 `{}` 占位符的格式字串和需要放入占位符的值。自訂訊息有助於記錄斷言的意義；當測試失敗時就能更好的理解代碼出了什麼問題。

例如，比如說有一個根據人名進行問候的函數，而我們希望測試將傳遞給函數的人名顯示在輸出中：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
pub fn greeting(name: &str) -> String {
    format!("Hello {}!", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(result.contains("Carol"));
    }
}
```

這個程序的需求還沒有被確定，因此問候文本開頭的 `Hello` 文本很可能會改變。然而我們並不想在需求改變時不得不更新測試，所以相比檢查 `greeting` 函數返回的確切值，我們將僅僅斷言輸出的文本中包含輸入參數。

讓我們透過將 `greeting` 改為不包含 `name` 來在代碼中引入一個 bug 來測試失敗時是怎樣的：

```rust,not_desired_behavior
# fn main() {}
pub fn greeting(name: &str) -> String {
    String::from("Hello!")
}
```

運行測試會產生：

```text
running 1 test
test tests::greeting_contains_name ... FAILED

failures:

---- tests::greeting_contains_name stdout ----
thread 'tests::greeting_contains_name' panicked at 'assertion failed:
result.contains("Carol")', src/lib.rs:12:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.

failures:
    tests::greeting_contains_name
```

結果僅僅告訴了我們斷言失敗了和失敗的行號。一個更有用的失敗訊息應該列印出 `greeting` 函數的值。讓我們為測試函數增加一個自訂失敗訊息參數：帶占位符的格式字串，以及 `greeting` 函數的值：

```rust,ignore
#[test]
fn greeting_contains_name() {
    let result = greeting("Carol");
    assert!(
        result.contains("Carol"),
        "Greeting did not contain name, value was `{}`", result
    );
}
```

現在如果再次運行測試，將會看到更有價值的訊息：

```text
---- tests::greeting_contains_name stdout ----
thread 'tests::greeting_contains_name' panicked at 'Greeting did not
contain name, value was `Hello!`', src/lib.rs:12:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

可以在測試輸出中看到所取得的確切的值，這會幫助我們理解真正發生了什麼事，而不是期望發生什麼事。

### 使用 `should_panic` 檢查 panic

除了檢查代碼是否返回期望的正確的值之外，檢查代碼是否按照期望處理錯誤也是很重要的。例如，考慮第九章範例 9-10 創建的 `Guess` 類型。其他使用 `Guess` 的代碼都是基於 `Guess` 實例僅有的值範圍在 1 到 100 的前提。可以編寫一個測試來確保創建一個超出範圍的值的 `Guess` 實例會 panic。

可以通過對函數增加另一個屬性 `should_panic` 來實現這些。這個屬性在函數中的代碼 panic 時會通過，而在其中的代碼沒有 panic 時失敗。

範例 11-8 展示了一個檢查 `Guess::new` 是否按照我們的期望出錯的測試：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess {
            value
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

<span class="caption">範例 11-8：測試會造成 `panic!` 的條件</span>

`#[should_panic]` 屬性位於 `#[test]` 之後，對應的測試函數之前。讓我們看看測試通過時它是什麼樣子：

```text
running 1 test
test tests::greater_than_100 ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

看起來不錯！現在在代碼中引入 bug，移除 `new` 函數在值大於 100 時會 panic 的條件：

```rust,not_desired_behavior
# fn main() {}
# pub struct Guess {
#     value: i32,
# }
#
// --snip--

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1  {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess {
            value
        }
    }
}
```

如果運行範例 11-8 的測試，它會失敗：

```text
running 1 test
test tests::greater_than_100 ... FAILED

failures:

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

這回並沒有得到非常有用的訊息，不過一旦我們觀察測試函數，會發現它標註了 `#[should_panic]`。這個錯誤意味著代碼中測試函數 `Guess::new(200)` 並沒有產生 panic。

然而 `should_panic` 測試結果可能會非常含糊不清，因為它只是告訴我們代碼並沒有產生 panic。`should_panic` 甚至在一些不是我們期望的原因而導致 panic 時也會通過。為了使 `should_panic` 測試結果更精確，我們可以給 `should_panic` 屬性增加一個可選的 `expected` 參數。測試工具會確保錯誤訊息中包含其提供的文本。例如，考慮範例 11-9 中修改過的 `Guess`，這裡 `new` 函數根據其值是過大還或者過小而提供不同的 panic 訊息：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# fn main() {}
# pub struct Guess {
#     value: i32,
# }
#
// --snip--

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!("Guess value must be greater than or equal to 1, got {}.",
                   value);
        } else if value > 100 {
            panic!("Guess value must be less than or equal to 100, got {}.",
                   value);
        }

        Guess {
            value
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "Guess value must be less than or equal to 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

<span class="caption">範例 11-9：一個會帶有特定錯誤訊息的 `panic!` 條件的測試</span>

這個測試會通過，因為 `should_panic` 屬性中 `expected` 參數提供的值是 `Guess::new` 函數 panic 訊息的子串。我們可以指定期望的整個 panic 訊息，在這個例子中是 `Guess value must be less than or equal to 100, got 200.` 。 `expected` 訊息的選擇取決於 panic 訊息有多獨特或動態，和你希望測試有多準確。在這個例子中，錯誤訊息的子字串足以確保函數在 `else if value > 100` 的情況下運行。

為了觀察帶有 `expected` 訊息的 `should_panic` 測試失敗時會發生什麼事，讓我們再次引入一個 bug，將 `if value < 1` 和 `else if value > 100` 的代碼塊對換：

```rust,ignore,not_desired_behavior
if value < 1 {
    panic!("Guess value must be less than or equal to 100, got {}.", value);
} else if value > 100 {
    panic!("Guess value must be greater than or equal to 1, got {}.", value);
}
```

這一次執行 `should_panic` 測試，它會失敗：

```text
running 1 test
test tests::greater_than_100 ... FAILED

failures:

---- tests::greater_than_100 stdout ----
thread 'tests::greater_than_100' panicked at 'Guess value must be
greater than or equal to 1, got 200.', src/lib.rs:11:13
note: Run with `RUST_BACKTRACE=1` for a backtrace.
note: Panic did not include expected string 'Guess value must be less than or
equal to 100'

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

失敗訊息表明測試確實如期望 panic 了，不過 panic 訊息中並沒有包含 `expected` 訊息 `'Guess value must be less than or equal to 100'`。而我們得到的 panic 訊息是 `'Guess value must be greater than or equal to 1, got 200.'`。這樣就可以開始尋找 bug 在哪了！

### 將 `Result<T, E>` 用於測試

目前為止，我們編寫的測試在失敗時就會 panic。也可以使用 `Result<T, E>` 編寫測試！這裡是第一個例子採用了 Result：

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

現在 `it_works` 函數的返回值類型為 `Result<(), String>`。在函數體中，不同於調用 `assert_eq!` 宏，而是在測試通過時返回 `Ok(())`，在測試失敗時返回帶有 `String` 的 `Err`。

這樣編寫測試來返回 `Result<T, E>` 就可以在函數體中使用問號運算符，如此可以方便的編寫任何運算符會返回 `Err` 成員的測試。

不能對這些使用  `Result<T, E>` 的測試使用 `#[should_panic]` 註解。相反應該在測試失敗時直接返回 `Err` 值。

現在你知道了幾種編寫測試的方法，讓我們看看運行測試時會發生什麼事，和可以用於 `cargo test` 的不同選項。

[concatenation-with-the--operator-or-the-format-macro]:
ch08-02-strings.html#concatenation-with-the--operator-or-the-format-macro
[controlling-how-tests-are-run]:
ch11-02-running-tests.html#controlling-how-tests-are-run
[derivable-traits]: appendix-03-derivable-traits.html
[doc-comments]: ch14-02-publishing-to-crates-io.html#documentation-comments-as-tests
[paths-for-referring-to-an-item-in-the-module-tree]: ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html

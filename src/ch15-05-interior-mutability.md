## `RefCell<T>` 和內部可變性模式

> [ch15-05-interior-mutability.md](https://github.com/rust-lang/book/blob/master/src/ch15-05-interior-mutability.md) <br>
> commit 26565efc3f62d9dacb7c2c6d0f5974360e459493

**內部可變性**（_Interior mutability_）是 Rust 中的一個設計模式，它允許你即使在有不可變引用時也可以改變數據，這通常是借用規則所不允許的。為了改變數據，該模式在數據結構中使用 `unsafe` 代碼來模糊 Rust 通常的可變性和借用規則。我們還未講到不安全代碼；第十九章會學習它們。當可以確保代碼在運行時會遵守借用規則，即使編譯器不能保證的情況，可以選擇使用那些運用內部可變性模式的類型。所涉及的 `unsafe` 代碼將被封裝進安全的 API 中，而外部類型仍然是不可變的。

讓我們通過遵循內部可變性模式的 `RefCell<T>` 類型來開始探索。

### 通過 `RefCell<T>` 在運行時檢查借用規則

不同於 `Rc<T>`，`RefCell<T>` 代表其數據的唯一的所有權。那麼是什麼讓 `RefCell<T>` 不同於像 `Box<T>` 這樣的類型呢？回憶一下第四章所學的借用規則：

1. 在任意給定時刻，只能擁有一個可變引用或任意數量的不可變引用 **之一**（而不是兩者）。
2. 引用必須總是有效的。

對於引用和 `Box<T>`，借用規則的不可變性作用於編譯時。對於 `RefCell<T>`，這些不可變性作用於 **運行時**。對於引用，如果違反這些規則，會得到一個編譯錯誤。而對於 `RefCell<T>`，如果違反這些規則程序會 panic 並退出。

在編譯時檢查借用規則的優勢是這些錯誤將在開發過程的早期被捕獲，同時對運行時沒有性能影響，因為所有的分析都提前完成了。為此，在編譯時檢查借用規則是大部分情況的最佳選擇，這也正是其為何是 Rust 的默認行為。

相反在運行時檢查借用規則的好處則是允許出現特定記憶體安全的場景，而它們在編譯時檢查中是不允許的。靜態分析，正如 Rust 編譯器，是天生保守的。但代碼的一些屬性不可能通過分析代碼發現：其中最著名的就是 [停機問題（Halting Problem）](https://zh.wikipedia.org/wiki/%E5%81%9C%E6%9C%BA%E9%97%AE%E9%A2%98)，這超出了本書的範疇，不過如果你感興趣的話這是一個值得研究的有趣主題。

因為一些分析是不可能的，如果 Rust 編譯器不能通過所有權規則編譯，它可能會拒絕一個正確的程序；從這種角度考慮它是保守的。如果 Rust 接受不正確的程序，那麼用戶也就不會相信 Rust 所做的保證了。然而，如果 Rust 拒絕正確的程序，雖然會給程式設計師帶來不便，但不會帶來災難。`RefCell<T>` 正是用於當你確信代碼遵守借用規則，而編譯器不能理解和確定的時候。

類似於 `Rc<T>`，`RefCell<T>` 只能用於單執行緒場景。如果嘗試在多執行緒上下文中使用`RefCell<T>`，會得到一個編譯錯誤。第十六章會介紹如何在多執行緒程序中使用 `RefCell<T>` 的功能。

如下為選擇 `Box<T>`，`Rc<T>` 或 `RefCell<T>` 的理由：

- `Rc<T>` 允許相同數據有多個所有者；`Box<T>` 和 `RefCell<T>` 有單一所有者。
- `Box<T>` 允許在編譯時執行不可變或可變借用檢查；`Rc<T>`僅允許在編譯時執行不可變借用檢查；`RefCell<T>` 允許在運行時執行不可變或可變借用檢查。
- 因為 `RefCell<T>` 允許在運行時執行可變借用檢查，所以我們可以在即便 `RefCell<T>` 自身是不可變的情況下修改其內部的值。

在不可變值內部改變值就是 **內部可變性** 模式。讓我們看看何時內部可變性是有用的，並討論這是如何成為可能的。

### 內部可變性：不可變值的可變借用

借用規則的一個推論是當有一個不可變值時，不能可變地借用它。例如，如下代碼不能編譯：

```rust,ignore,does_not_compile
fn main() {
    let x = 5;
    let y = &mut x;
}
```

如果嘗試編譯，會得到如下錯誤：

```text
error[E0596]: cannot borrow immutable local variable `x` as mutable
 --> src/main.rs:3:18
  |
2 |     let x = 5;
  |         - consider changing this to `mut x`
3 |     let y = &mut x;
  |                  ^ cannot borrow mutably
```

然而，特定情況下，令一個值在其方法內部能夠修改自身，而在其他代碼中仍視為不可變，是很有用的。值方法外部的代碼就不能修改其值了。`RefCell<T>` 是一個獲得內部可變性的方法。`RefCell<T>` 並沒有完全繞開借用規則，編譯器中的借用檢查器允許內部可變性並相應地在運行時檢查借用規則。如果違反了這些規則，會出現 panic 而不是編譯錯誤。

讓我們透過一個實際的例子來探索何處可以使用 `RefCell<T>` 來修改不可變值並看看為何這麼做是有意義的。

#### 內部可變性的用例：mock 對象

**測試替身**（_test double_）是一個通用編程概念，它代表一個在測試中替代某個類型的類型。**mock 對象** 是特定類型的測試替身，它們記錄測試過程中發生了什麼以便可以斷言操作是正確的。

雖然 Rust 中的對象與其他語言中的對象並不是一回事，Rust 也沒有像其他語言那樣在標準庫中內建 mock 對象功能，不過我們確實可以創建一個與 mock 對象有著相同功能的結構體。

如下是一個我們想要測試的場景：我們在編寫一個紀錄某個值與最大值的差距的庫，並根據當前值與最大值的差距來發送消息。例如，這個庫可以用於記錄用戶所允許的 API 調用數量限額。

該庫只提供記錄與最大值的差距，以及何種情況發送什麼消息的功能。使用此庫的程序則期望提供實際發送消息的機制：程序可以選擇記錄一條消息、發送 email、發送簡訊等等。庫本身無需知道這些細節；只需實現其提供的 `Messenger` trait 即可。範例 15-20 展示了庫代碼：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
    where T: Messenger {
    pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
             self.messenger.send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger.send("Warning: You've used up over 75% of your quota!");
        }
    }
}
```

<span class="caption">範例 15-20：一個紀錄某個值與最大值差距的庫，並根據此值的特定級別發出警告</span>

這些程式碼中一個重要部分是擁有一個方法 `send` 的 `Messenger` trait，其獲取一個 `self` 的不可變引用和文本訊息。這是我們的 mock 對象所需要擁有的介面。另一個重要的部分是我們需要測試 `LimitTracker` 的 `set_value` 方法的行為。可以改變傳遞的 `value` 參數的值，不過 `set_value` 並沒有返回任何可供斷言的值。也就是說，如果使用某個實現了 `Messenger` trait 的值和特定的 `max` 創建 `LimitTracker`，當傳遞不同 `value` 值時，消息發送者應被告知發送合適的消息。

我們所需的 mock 對象是，調用 `send` 並不實際發送 email 或消息，而是只記錄訊息被通知要發送了。可以新建一個 mock 對象範例，用其創建 `LimitTracker`，調用 `LimitTracker` 的 `set_value` 方法，然後檢查 mock 對象是否有我們期望的消息。範例 15-21 展示了一個如此嘗試的 mock 對象實現，不過借用檢查器並不允許：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,does_not_compile
#[cfg(test)]
mod tests {
    use super::*;

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: vec![] }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.len(), 1);
    }
}
```

<span class="caption">範例 15-21：嘗試實現 `MockMessenger`，借用檢查器不允許這麼做</span>

測試代碼定義了一個 `MockMessenger` 結構體，其 `sent_messages` 欄位為一個 `String` 值的 `Vec` 用來記錄被告知發送的消息。我們還定義了一個關聯函數 `new` 以便於新建從空消息列表開始的 `MockMessenger` 值。接著為 `MockMessenger` 實現 `Messenger` trait 這樣就可以為 `LimitTracker` 提供一個 `MockMessenger`。在 `send` 方法的定義中，獲取傳入的消息作為參數並儲存在 `MockMessenger` 的 `sent_messages` 列表中。

在測試中，我們測試了當 `LimitTracker` 被告知將 `value` 設置為超過 `max` 值 75% 的某個值。首先新建一個 `MockMessenger`，其從空消息列表開始。接著新建一個 `LimitTracker` 並傳遞新建 `MockMessenger` 的引用和 `max` 值 100。我們使用值 80 調用 `LimitTracker` 的 `set_value` 方法，這超過了 100 的 75%。接著斷言 `MockMessenger` 中記錄的消息列表應該有一條消息。

然而，這個測試是有問題的：

```text
error[E0596]: cannot borrow immutable field `self.sent_messages` as mutable
  --> src/lib.rs:52:13
   |
51 |         fn send(&self, message: &str) {
   |                 ----- use `&mut self` here to make mutable
52 |             self.sent_messages.push(String::from(message));
   |             ^^^^^^^^^^^^^^^^^^ cannot mutably borrow immutable field
```

不能修改 `MockMessenger` 來記錄消息，因為 `send` 方法獲取了 `self` 的不可變引用。我們也不能參考錯誤文本的建議使用 `&mut self` 替代，因為這樣 `send` 的簽名就不符合 `Messenger` trait 定義中的簽名了（可以試著這麼改，看看會出現什麼錯誤訊息）。

這正是內部可變性的用武之地！我們將通過 `RefCell` 來儲存 `sent_messages`，然後 `send` 將能夠修改 `sent_messages` 並儲存消息。範例 15-22 展示了代碼：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub trait Messenger {
#     fn send(&self, msg: &str);
# }
#
# pub struct LimitTracker<'a, T: Messenger> {
#     messenger: &'a T,
#     value: usize,
#     max: usize,
# }
#
# impl<'a, T> LimitTracker<'a, T>
#     where T: Messenger {
#     pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
#         LimitTracker {
#             messenger,
#             value: 0,
#             max,
#         }
#     }
#
#     pub fn set_value(&mut self, value: usize) {
#         self.value = value;
#
#         let percentage_of_max = self.value as f64 / self.max as f64;
#
#         if percentage_of_max >= 1.0 {
#             self.messenger.send("Error: You are over your quota!");
#         } else if percentage_of_max >= 0.9 {
#              self.messenger.send("Urgent warning: You've used up over 90% of your quota!");
#         } else if percentage_of_max >= 0.75 {
#             self.messenger.send("Warning: You've used up over 75% of your quota!");
#         }
#     }
# }
#
#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: RefCell::new(vec![]) }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.borrow_mut().push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        // --snip--
#         let mock_messenger = MockMessenger::new();
#         let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);
#         limit_tracker.set_value(75);

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
# fn main() {}
```

<span class="caption">範例 15-22：使用 `RefCell<T>` 能夠在外部值被認為是不可變的情況下修改內部值</span>

現在 `sent_messages` 欄位的類型是 `RefCell<Vec<String>>` 而不是 `Vec<String>`。在 `new` 函數中新建了一個 `RefCell` 範例替代空 vector。

對於 `send` 方法的實現，第一個參數仍為 `self` 的不可變借用，這是符合方法定義的。我們調用 `self.sent_messages` 中 `RefCell` 的 `borrow_mut` 方法來獲取 `RefCell` 中值的可變引用，這是一個 vector。接著可以對 vector 的可變引用調用 `push` 以便記錄測試過程中看到的消息。

最後必須做出的修改位於斷言中：為了看到其內部 vector 中有多少個項，需要調用 `RefCell` 的 `borrow` 以獲取 vector 的不可變引用。

現在我們見識了如何使用 `RefCell<T>`，讓我們研究一下它怎樣工作的！

### `RefCell<T>` 在運行時記錄借用

當創建不可變和可變引用時，我們分別使用 `&` 和 `&mut` 語法。對於 `RefCell<T>` 來說，則是 `borrow` 和 `borrow_mut` 方法，這屬於 `RefCell<T>` 安全 API 的一部分。`borrow` 方法返回 `Ref<T>` 類型的智慧指針，`borrow_mut` 方法返回 `RefMut` 類型的智慧指針。這兩個類型都實現了 `Deref`，所以可以當作常規引用對待。

`RefCell<T>` 記錄當前有多少個活動的 `Ref<T>` 和 `RefMut<T>` 智慧指針。每次調用 `borrow`，`RefCell<T>` 將活動的不可變借用計數加一。當 `Ref<T>` 值離開作用域時，不可變借用計數減一。就像編譯時借用規則一樣，`RefCell<T>` 在任何時候只允許有多個不可變借用或一個可變借用。

如果我們嘗試違反這些規則，相比引用時的編譯時錯誤，`RefCell<T>` 的實現會在運行時出現 panic。範例 15-23 展示了對範例 15-22 中 `send` 實現的修改，這裡我們故意嘗試在相同作用域創建兩個可變借用以便示範 `RefCell<T>` 不允許我們在運行時這麼做：

<span class="filename">檔案名: src/lib.rs</span>

```rust,ignore,panics
impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        let mut one_borrow = self.sent_messages.borrow_mut();
        let mut two_borrow = self.sent_messages.borrow_mut();

        one_borrow.push(String::from(message));
        two_borrow.push(String::from(message));
    }
}
```

<span class="caption">範例 15-23：在同一作用域中創建兩個可變引用並觀察 `RefCell<T>` panic</span>

這裡為 `borrow_mut` 返回的 `RefMut` 智慧指針創建了 `one_borrow` 變數。接著用相同的方式在變數 `two_borrow` 創建了另一個可變借用。這會在相同作用域中創建兩個可變引用，這是不允許的。當運行庫的測試時，範例 15-23 編譯時不會有任何錯誤，不過測試會失敗：

```text
---- tests::it_sends_an_over_75_percent_warning_message stdout ----
    thread 'tests::it_sends_an_over_75_percent_warning_message' panicked at
'already borrowed: BorrowMutError', src/libcore/result.rs:906:4
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

注意代碼 panic 和訊息 `already borrowed: BorrowMutError`。這也就是 `RefCell<T>` 如何在運行時處理違反借用規則的情況。

在運行時捕獲借用錯誤而不是編譯時意味著將會在開發過程的後期才會發現錯誤，甚至有可能發布到生產環境才發現；還會因為在運行時而不是編譯時記錄借用而導致少量的運行時性能懲罰。然而，使用 `RefCell` 使得在只允許不可變值的上下文中編寫修改自身以記錄消息的 mock 對象成為可能。雖然有取捨，但是我們可以選擇使用 `RefCell<T>` 來獲得比常規引用所能提供的更多的功能。

### 結合 `Rc<T>` 和 `RefCell<T>` 來擁有多個可變數據所有者

`RefCell<T>` 的一個常見用法是與 `Rc<T>` 結合。回憶一下 `Rc<T>` 允許對相同數據有多個所有者，不過只能提供數據的不可變訪問。如果有一個儲存了 `RefCell<T>` 的 `Rc<T>` 的話，就可以得到有多個所有者 **並且** 可以修改的值了！

例如，回憶範例 15-18 的 cons list 的例子中使用 `Rc<T>` 使得多個列表共享另一個列表的所有權。因為 `Rc<T>` 只存放不可變值，所以一旦創建了這些列表值後就不能修改。讓我們加入 `RefCell<T>` 來獲得修改列表中值的能力。範例 15-24 展示了通過在 `Cons` 定義中使用 `RefCell<T>`，我們就允許修改所有列表中的值了：

<span class="filename">檔案名: src/main.rs</span>

```rust
#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));

    let b = Cons(Rc::new(RefCell::new(6)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(10)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {:?}", a);
    println!("b after = {:?}", b);
    println!("c after = {:?}", c);
}
```

<span class="caption">範例 15-24：使用 `Rc<RefCell<i32>>` 創建可以修改的 `List`</span>

這裡創建了一個 `Rc<RefCell<i32>>` 實例並儲存在變數 `value` 中以便之後直接訪問。接著在 `a` 中用包含 `value` 的 `Cons` 成員創建了一個 `List`。需要複製 `value` 以便 `a` 和 `value` 都能擁有其內部值 `5` 的所有權，而不是將所有權從 `value` 移動到 `a` 或者讓 `a` 借用 `value`。

我們將列表 `a` 封裝進了 `Rc<T>` 這樣當創建列表 `b` 和 `c` 時，他們都可以引用 `a`，正如範例 15-18 一樣。

一旦創建了列表 `a`、`b` 和 `c`，我們將 `value` 的值加 10。為此對 `value` 調用了 `borrow_mut`，這裡使用了第五章討論的自動解引用功能（[“`->` 運算符到哪去了？”][wheres-the---operator] 部分）來解引用 `Rc<T>` 以獲取其內部的 `RefCell<T>` 值。`borrow_mut` 方法返回 `RefMut<T>` 智慧指針，可以對其使用解引用運算符並修改其內部值。

當我們列印出 `a`、`b` 和 `c` 時，可以看到他們都擁有修改後的值 15 而不是 5：

```text
a after = Cons(RefCell { value: 15 }, Nil)
b after = Cons(RefCell { value: 6 }, Cons(RefCell { value: 15 }, Nil))
c after = Cons(RefCell { value: 10 }, Cons(RefCell { value: 15 }, Nil))
```

這是非常巧妙的！透過使用 `RefCell<T>`，我們可以擁有一個表面上不可變的 `List`，不過可以使用 `RefCell<T>` 中提供內部可變性的方法來在需要時修改數據。`RefCell<T>` 的運行時借用規則檢查也確實保護我們免於出現數據競爭——有時為了數據結構的靈活性而付出一些性能是值得的。

標準庫中也有其他提供內部可變性的類型，比如 `Cell<T>`，它類似 `RefCell<T>` 但有一點除外：它並非提供內部值的引用，而是把值拷貝進和拷貝出 `Cell<T>`。還有 `Mutex<T>`，其提供執行緒間安全的內部可變性，我們將在第 16 章中討論其用法。請查看標準庫來獲取更多細節關於這些不同類型之間的區別。

[wheres-the---operator]: ch05-03-method-syntax.html#wheres-the---operator

## 引用循環與記憶體洩漏

> [ch15-06-reference-cycles.md](https://github.com/rust-lang/book/blob/master/src/ch15-06-reference-cycles.md) <br>
> commit f617d58c1a88dd2912739a041fd4725d127bf9fb

Rust 的記憶體安全性保證使其難以意外地製造永遠也不會被清理的記憶體（被稱為 **記憶體洩漏**（_memory leak_）），但並不是不可能。與在編譯時拒絕數據競爭不同， Rust 並不保證完全地避免記憶體洩漏，這意味著記憶體洩漏在 Rust 被認為是記憶體安全的。這一點可以通過 `Rc<T>` 和 `RefCell<T>` 看出：創建引用循環的可能性是存在的。這會造成記憶體洩漏，因為每一項的引用計數永遠也到不了 0，其值也永遠不會被丟棄。

### 製造引用循環

讓我們看看引用循環是如何發生的以及如何避免它。以範例 15-25 中的 `List` 枚舉和 `tail` 方法的定義開始：

<span class="filename">檔案名: src/main.rs</span>

```rust
# fn main() {}
use std::rc::Rc;
use std::cell::RefCell;
use crate::List::{Cons, Nil};

#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Rc<List>>),
    Nil,
}

impl List {
    fn tail(&self) -> Option<&RefCell<Rc<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}
```

<span class="caption">範例 15-25: 一個存放 `RefCell` 的 cons list 定義，這樣可以修改 `Cons` 成員所引用的數據</span>

這裡採用了範例 15-25 中 `List` 定義的另一種變體。現在 `Cons` 成員的第二個元素是 `RefCell<Rc<List>>`，這意味著不同於像範例 15-24 那樣能夠修改 `i32` 的值，我們希望能夠修改 `Cons` 成員所指向的 `List`。這裡還增加了一個 `tail` 方法來方便我們在有 `Cons` 成員的時候訪問其第二項。

在範例 15-26 中增加了一個 `main` 函數，其使用了範例 15-25 中的定義。這些程式碼在 `a` 中創建了一個列表，一個指向 `a` 中列表的 `b` 列表，接著修改 `a` 中的列表指向 `b` 中的列表，這會創建一個引用循環。在這個過程的多個位置有 `println!` 語句展示引用計數。

<span class="filename">Filename: src/main.rs</span>

```rust
# use crate::List::{Cons, Nil};
# use std::rc::Rc;
# use std::cell::RefCell;
# #[derive(Debug)]
# enum List {
#     Cons(i32, RefCell<Rc<List>>),
#     Nil,
# }
#
# impl List {
#     fn tail(&self) -> Option<&RefCell<Rc<List>>> {
#         match self {
#             Cons(_, item) => Some(item),
#             Nil => None,
#         }
#     }
# }
#
fn main() {
    let a = Rc::new(Cons(5, RefCell::new(Rc::new(Nil))));

    println!("a initial rc count = {}", Rc::strong_count(&a));
    println!("a next item = {:?}", a.tail());

    let b = Rc::new(Cons(10, RefCell::new(Rc::clone(&a))));

    println!("a rc count after b creation = {}", Rc::strong_count(&a));
    println!("b initial rc count = {}", Rc::strong_count(&b));
    println!("b next item = {:?}", b.tail());

    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }

    println!("b rc count after changing a = {}", Rc::strong_count(&b));
    println!("a rc count after changing a = {}", Rc::strong_count(&a));

    // Uncomment the next line to see that we have a cycle;
    // it will overflow the stack
    // println!("a next item = {:?}", a.tail());
}
```

<span class="caption">範例 15-26：創建一個引用循環：兩個 `List` 值互相指向彼此</span>

這裡在變數 `a` 中創建了一個 `Rc<List>` 實例來存放初值為 `5, Nil` 的 `List` 值。接著在變數 `b` 中創建了存放包含值 10 和指向列表 `a` 的 `List` 的另一個 `Rc<List>` 實例。

最後，修改 `a` 使其指向 `b` 而不是 `Nil`，這就創建了一個循環。為此需要使用 `tail` 方法獲取 `a` 中 `RefCell<Rc<List>>` 的引用，並放入變數 `link` 中。接著使用 `RefCell<Rc<List>>` 的 `borrow_mut` 方法將其值從存放 `Nil` 的 `Rc<List>` 修改為 `b` 中的 `Rc<List>`。

如果保持最後的 `println!` 行注釋並運行程式碼，會得到如下輸出：

```text
a initial rc count = 1
a next item = Some(RefCell { value: Nil })
a rc count after b creation = 2
b initial rc count = 1
b next item = Some(RefCell { value: Cons(5, RefCell { value: Nil }) })
b rc count after changing a = 2
a rc count after changing a = 2
```

可以看到將 `a` 修改為指向 `b` 之後，`a` 和 `b` 中都有的 `Rc<List>` 實例的引用計數為 2。在 `main` 的結尾，Rust 會嘗試首先丟棄 `b`，這會使 `a` 和 `b` 中 `Rc<List>` 實例的引用計數減 1。

然而，因為 `a` 仍然引用 `b` 中的 `Rc<List>`，`Rc<List>` 的引用計數是 1 而不是 0，所以 `Rc<List>` 在堆上的記憶體不會被丟棄。其記憶體會因為引用計數為 1 而永遠停留。為了更形象的展示，我們創建了一個如圖 15-4 所示的引用循環：

<img alt="Reference cycle of lists" src="img/trpl15-04.svg" class="center" />

<span class="caption">圖 15-4: 列表 `a` 和 `b` 彼此互相指向形成引用循環</span>

如果取消最後 `println!` 的注釋並運行程序，Rust 會嘗試列印出 `a` 指向 `b` 指向 `a` 這樣的循環直到棧溢出。

這個特定的例子中，創建了引用循環之後程序立刻就結束了。這個循環的結果並不可怕。如果在更為複雜的程序中並在循環裡分配了很多記憶體並佔有很長時間，這個程序會使用多於它所需要的記憶體，並有可能壓垮系統並造成沒有記憶體可供使用。

創建引用循環並不容易，但也不是不可能。如果你有包含 `Rc<T>` 的 `RefCell<T>` 值或類似的嵌套結合了內部可變性和引用計數的類型，請務必小心確保你沒有形成一個引用循環；你無法指望 Rust 幫你捕獲它們。創建引用循環是一個程序上的邏輯 bug，你應該使用自動化測試、代碼評審和其他軟體開發最佳實踐來使其最小化。

另一個解決方案是重新組織數據結構，使得一部分引用擁有所有權而另一部分沒有。換句話說，循環將由一些擁有所有權的關係和一些無所有權的關係組成，只有所有權關係才能影響值是否可以被丟棄。在範例 15-25 中，我們總是希望 `Cons` 成員擁有其列表，所以重新組織數據結構是不可能的。讓我們看看一個由父節點和子節點構成的圖的例子，觀察何時是使用無所有權的關係來避免引用循環的合適時機。

### 避免引用循環：將 `Rc<T>` 變為 `Weak<T>`

到目前為止，我們已經展示了調用 `Rc::clone` 會增加 `Rc<T>` 實例的 `strong_count`，和只在其 `strong_count` 為 0 時才會被清理的 `Rc<T>` 實例。你也可以透過調用 `Rc::downgrade` 並傳遞 `Rc<T>` 實例的引用來創建其值的 **弱引用**（_weak reference_）。調用 `Rc::downgrade` 時會得到 `Weak<T>` 類型的智慧指針。不同於將 `Rc<T>` 實例的 `strong_count` 加1，調用 `Rc::downgrade` 會將 `weak_count` 加1。`Rc<T>` 類型使用 `weak_count` 來記錄其存在多少個 `Weak<T>` 引用，類似於 `strong_count`。其區別在於 `weak_count` 無需計數為 0 就能使 `Rc<T>` 實例被清理。

強引用代表如何共享 `Rc<T>` 實例的所有權，但弱引用並不屬於所有權關係。他們不會造成引用循環，因為任何弱引用的循環會在其相關的強引用計數為 0 時被打斷。

因為 `Weak<T>` 引用的值可能已經被丟棄了，為了使用 `Weak<T>` 所指向的值，我們必須確保其值仍然有效。為此可以調用 `Weak<T>` 實例的 `upgrade` 方法，這會返回 `Option<Rc<T>>`。如果 `Rc<T>` 值還未被丟棄，則結果是 `Some`；如果 `Rc<T>` 已被丟棄，則結果是 `None`。因為 `upgrade` 返回一個 `Option<T>`，我們確信 Rust 會處理 `Some` 和 `None` 的情況，所以它不會返回非法指針。

我們會創建一個某項知道其子項**和**父項的樹形結構的例子，而不是只知道其下一項的列表。

#### 創建樹形數據結構：帶有子節點的 `Node`

在最開始，我們將會構建一個帶有子節點的樹。讓我們創建一個用於存放其擁有所有權的 `i32` 值和其子節點引用的 `Node`：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    children: RefCell<Vec<Rc<Node>>>,
}
```

我們希望能夠 `Node` 擁有其子節點，同時也希望透過變數來共享所有權，以便可以直接訪問樹中的每一個 `Node`，為此 `Vec<T>` 的項的類型被定義為 `Rc<Node>`。我們還希望能修改其他節點的子節點，所以 `children` 中 `Vec<Rc<Node>>` 被放進了 `RefCell<T>`。

接下來，使用此結構體定義來創建一個叫做 `leaf` 的帶有值 3 且沒有子節點的 `Node` 實例，和另一個帶有值 5 並以 `leaf` 作為子節點的實例 `branch`，如範例 15-27 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::rc::Rc;
# use std::cell::RefCell;
#
# #[derive(Debug)]
# struct Node {
#     value: i32,
#    children: RefCell<Vec<Rc<Node>>>,
# }
#
fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        children: RefCell::new(vec![]),
    });

    let branch = Rc::new(Node {
        value: 5,
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });
}
```

<span class="caption">範例 15-27：創建沒有子節點的 `leaf` 節點和以 `leaf` 作為子節點的 `branch` 節點</span>

這裡複製了 `leaf` 中的 `Rc<Node>` 並儲存在了 `branch` 中，這意味著 `leaf` 中的 `Node` 現在有兩個所有者：`leaf`和`branch`。可以通過 `branch.children` 從 `branch` 中獲得 `leaf`，不過無法從 `leaf` 到 `branch`。`leaf` 沒有到 `branch` 的引用且並不知道他們相互關聯。我們希望 `leaf` 知道 `branch` 是其父節點。稍後我們會這麼做。

#### 增加從子到父的引用

為了使子節點知道其父節點，需要在 `Node` 結構體定義中增加一個 `parent` 欄位。問題是 `parent` 的類型應該是什麼。我們知道其不能包含 `Rc<T>`，因為這樣 `leaf.parent` 將會指向 `branch` 而 `branch.children` 會包含 `leaf` 的指針，這會形成引用循環，會造成其 `strong_count` 永遠也不會為 0.

現在換一種方式思考這個關係，父節點應該擁有其子節點：如果父節點被丟棄了，其子節點也應該被丟棄。然而子節點不應該擁有其父節點：如果丟棄子節點，其父節點應該依然存在。這正是弱引用的例子！

所以 `parent` 使用 `Weak<T>` 類型而不是 `Rc<T>`，具體來說是 `RefCell<Weak<Node>>`。現在 `Node` 結構體定義看起來像這樣：

<span class="filename">檔案名: src/main.rs</span>

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}
```

這樣，一個節點就能夠引用其父節點，但不擁有其父節點。在範例 15-28 中，我們更新 `main` 來使用新定義以便 `leaf` 節點可以通過 `branch` 引用其父節點：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::rc::{Rc, Weak};
# use std::cell::RefCell;
#
# #[derive(Debug)]
# struct Node {
#     value: i32,
#     parent: RefCell<Weak<Node>>,
#     children: RefCell<Vec<Rc<Node>>>,
# }
#
fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
}
```

<span class="caption">範例 15-28：一個 `leaf` 節點，其擁有指向其父節點 `branch` 的 `Weak` 引用</span>

創建 `leaf` 節點類似於範例 15-27 中如何創建 `leaf` 節點的，除了 `parent` 欄位有所不同：`leaf` 開始時沒有父節點，所以我們新建了一個空的 `Weak` 引用實例。

此時，當嘗試使用 `upgrade` 方法獲取 `leaf` 的父節點引用時，會得到一個 `None` 值。如第一個 `println!` 輸出所示：

```text
leaf parent = None
```

當創建 `branch` 節點時，其也會新建一個 `Weak<Node>` 引用，因為 `branch` 並沒有父節點。`leaf` 仍然作為 `branch` 的一個子節點。一旦在 `branch` 中有了 `Node` 實例，就可以修改 `leaf` 使其擁有指向父節點的 `Weak<Node>` 引用。這裡使用了 `leaf` 中 `parent` 欄位裡的 `RefCell<Weak<Node>>` 的 `borrow_mut` 方法，接著使用了 `Rc::downgrade` 函數來從 `branch` 中的 `Rc<Node>` 值創建了一個指向 `branch` 的 `Weak<Node>` 引用。

當再次列印出 `leaf` 的父節點時，這一次將會得到存放了 `branch` 的 `Some` 值：現在 `leaf` 可以訪問其父節點了！當列印出 `leaf` 時，我們也避免了如範例 15-26 中最終會導致棧溢出的循環：`Weak<Node>` 引用被列印為 `(Weak)`：

```text
leaf parent = Some(Node { value: 5, parent: RefCell { value: (Weak) },
children: RefCell { value: [Node { value: 3, parent: RefCell { value: (Weak) },
children: RefCell { value: [] } }] } })
```

沒有無限的輸出表明這段代碼並沒有造成引用循環。這一點也可以從觀察 `Rc::strong_count` 和 `Rc::weak_count` 調用的結果看出。

#### 可視化 `strong_count` 和 `weak_count` 的改變

讓我們透過創建了一個新的內部作用域並將 `branch` 的創建放入其中，來觀察 `Rc<Node>` 實例的 `strong_count` 和 `weak_count` 值的變化。這會展示當 `branch` 創建和離開作用域被丟棄時會發生什麼事。這些修改如範例 15-29 所示：

<span class="filename">檔案名: src/main.rs</span>

```rust
# use std::rc::{Rc, Weak};
# use std::cell::RefCell;
#
# #[derive(Debug)]
# struct Node {
#     value: i32,
#     parent: RefCell<Weak<Node>>,
#     children: RefCell<Vec<Rc<Node>>>,
# }
#
fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!(
        "leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf),
        Rc::weak_count(&leaf),
    );

    {
        let branch = Rc::new(Node {
            value: 5,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&leaf)]),
        });

        *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

        println!(
            "branch strong = {}, weak = {}",
            Rc::strong_count(&branch),
            Rc::weak_count(&branch),
        );

        println!(
            "leaf strong = {}, weak = {}",
            Rc::strong_count(&leaf),
            Rc::weak_count(&leaf),
        );
    }

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
    println!(
        "leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf),
        Rc::weak_count(&leaf),
    );
}
```

<span class="caption">範例 15-29：在內部作用域創建 `branch` 並檢查其強弱引用計數</span>

一旦創建了 `leaf`，其 `Rc<Node>` 的強引用計數為 1，弱引用計數為 0。在內部作用域中創建了 `branch` 並與 `leaf` 相關聯，此時 `branch` 中 `Rc<Node>` 的強引用計數為 1，弱引用計數為 1（因為 `leaf.parent` 通過 `Weak<Node>` 指向 `branch`）。這裡 `leaf` 的強引用計數為 2，因為現在 `branch` 的 `branch.children` 中儲存了 `leaf` 的 `Rc<Node>` 的拷貝，不過弱引用計數仍然為 0。

當內部作用域結束時，`branch` 離開作用域，`Rc<Node>` 的強引用計數減少為 0，所以其 `Node` 被丟棄。來自 `leaf.parent` 的弱引用計數 1 與 `Node` 是否被丟棄無關，所以並沒有產生任何記憶體洩漏！

如果在內部作用域結束後嘗試訪問 `leaf` 的父節點，會再次得到 `None`。在程序的結尾，`leaf` 中 `Rc<Node>` 的強引用計數為 1，弱引用計數為 0，因為現在 `leaf` 又是 `Rc<Node>` 唯一的引用了。

所有這些管理計數和值的邏輯都內建於 `Rc<T>` 和 `Weak<T>` 以及它們的 `Drop` trait 實現中。通過在 `Node` 定義中指定從子節點到父節點的關係為一個`Weak<T>`引用，就能夠擁有父節點和子節點之間的雙向引用而不會造成引用循環和記憶體洩漏。

## 總結

這一章涵蓋了如何使用智慧指針來做出不同於 Rust 常規引用默認所提供的保證與取捨。`Box<T>` 有一個已知的大小並指向分配在堆上的數據。`Rc<T>` 記錄了堆上數據的引用數量以便可以擁有多個所有者。`RefCell<T>` 和其內部可變性提供了一個可以用於當需要不可變類型但是需要改變其內部值能力的類型，並在運行時而不是編譯時檢查借用規則。

我們還介紹了提供了很多智慧指針功能的 trait `Deref` 和 `Drop`。同時探索了會造成記憶體洩漏的引用循環，以及如何使用 `Weak<T>` 來避免它們。

如果本章內容引起了你的興趣並希望現在就實現你自己的智慧指針的話，請閱讀 [“The Rustonomicon”][nomicon] 來獲取更多有用的訊息。

[nomicon]: https://doc.rust-lang.org/stable/nomicon/

接下來，讓我們談談 Rust 的並發。屆時甚至還會學習到一些新的對並發有幫助的智慧指針。

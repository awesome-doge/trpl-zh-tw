## 面向對象語言的特徵

> [ch17-01-what-is-oo.md](https://github.com/rust-lang/book/blob/master/src/ch17-01-what-is-oo.md)
> <br>
> commit 34caca254c3e08ff9fe3ad985007f45e92577c03

關於一個語言被稱為面向對象所需的功能，在編程社區內並未達成一致意見。Rust 被很多不同的程式範式影響，包括面向對象編程；比如第十三章提到了來自函數式編程的特性。面向對象程式語言所共享的一些特性往往是對象、封裝和繼承。讓我們看一下這每一個概念的含義以及 Rust 是否支持他們。

### 對象包含數據和行為

由 Erich Gamma、Richard Helm、Ralph Johnson 和 John Vlissides（Addison-Wesley Professional, 1994）編寫的書 *Design Patterns: Elements of Reusable Object-Oriented Software* 被俗稱為 *The Gang of Four* (字面意思為“四人幫”)，它是面向對象編程模式的目錄。它這樣定義面向對象編程：

> Object-oriented programs are made up of objects. An *object* packages both
> data and the procedures that operate on that data. The procedures are
> typically called *methods* or *operations*.
>
> 面向對象的程序是由對象組成的。一個 **對象** 包含數據和操作這些數據的過程。這些過程通常被稱為 **方法** 或 **操作**。

在這個定義下，Rust 是面向對象的：結構體和枚舉包含數據而 `impl` 塊提供了在結構體和枚舉之上的方法。雖然帶有方法的結構體和枚舉並不被 **稱為** 對象，但是他們提供了與對象相同的功能，參考 *The Gang of Four* 中對象的定義。

### 封裝隱藏了實現細節

另一個通常與面向對象編程相關的方面是 **封裝**（*encapsulation*）的思想：對象的實現細節不能被使用對象的代碼獲取到。所以唯一與對象交互的方式是通過對象提供的公有 API；使用對象的代碼無法深入到對象內部並直接改變數據或者行為。封裝使得改變和重構對象的內部時無需改變使用對象的代碼。

就像我們在第七章討論的那樣：可以使用 `pub` 關鍵字來決定模組、類型、函數和方法是公有的，而默認情況下其他一切都是私有的。比如，我們可以定義一個包含一個 `i32` 類型 vector 的結構體 `AveragedCollection `。結構體也可以有一個欄位，該欄位保存了 vector 中所有值的平均值。這樣，希望知道結構體中的 vector 的平均值的人可以隨時獲取它，而無需自己計算。換句話說，`AveragedCollection` 會為我們快取平均值結果。範例 17-1 有 `AveragedCollection` 結構體的定義：

<span class="filename">檔案名: src/lib.rs</span>

```rust
pub struct AveragedCollection {
    list: Vec<i32>,
    average: f64,
}
```

<span class="caption">範例 17-1: `AveragedCollection` 結構體維護了一個整型列表和集合中所有元素的平均值。</span>

注意，結構體自身被標記為 `pub`，這樣其他代碼就可以使用這個結構體，但是在結構體內部的欄位仍然是私有的。這是非常重要的，因為我們希望保證變數被增加到列表或者被從列表刪除時，也會同時更新平均值。可以通過在結構體上實現 `add`、`remove` 和 `average` 方法來做到這一點，如範例 17-2 所示：

<span class="filename">檔案名: src/lib.rs</span>

```rust
# pub struct AveragedCollection {
#     list: Vec<i32>,
#     average: f64,
# }
impl AveragedCollection {
    pub fn add(&mut self, value: i32) {
        self.list.push(value);
        self.update_average();
    }

    pub fn remove(&mut self) -> Option<i32> {
        let result = self.list.pop();
        match result {
            Some(value) => {
                self.update_average();
                Some(value)
            },
            None => None,
        }
    }

    pub fn average(&self) -> f64 {
        self.average
    }

    fn update_average(&mut self) {
        let total: i32 = self.list.iter().sum();
        self.average = total as f64 / self.list.len() as f64;
    }
}
```

<span class="caption">範例 17-2: 在`AveragedCollection` 結構體上實現了`add`、`remove` 和 `average` 公有方法</span>

公有方法 `add`、`remove` 和 `average` 是修改 `AveragedCollection` 實例的唯一方式。當使用 `add` 方法把一個元素加入到 `list` 或者使用 `remove` 方法來刪除時，這些方法的實現同時會調用私有的 `update_average` 方法來更新 `average` 欄位。

`list` 和 `average` 是私有的，所以沒有其他方式來使得外部的代碼直接向 `list` 增加或者刪除元素，否則 `list` 改變時可能會導致 `average` 欄位不同步。`average` 方法返回 `average` 欄位的值，這使得外部的代碼只能讀取 `average` 而不能修改它。

因為我們已經封裝好了 `AveragedCollection` 的實現細節，將來可以輕鬆改變類似數據結構這些方面的內容。例如，可以使用 `HashSet<i32>` 代替 `Vec<i32>` 作為 `list` 欄位的類型。只要 `add`、`remove` 和 `average` 公有函數的簽名保持不變，使用 `AveragedCollection` 的代碼就無需改變。相反如果使得 `list` 為公有，就未必都會如此了： `HashSet<i32>` 和 `Vec<i32>` 使用不同的方法增加或移除項，所以如果要想直接修改 `list` 的話，外部的代碼可能不得不做出修改。

如果封裝是一個語言被認為是面向對象語言所必要的方面的話，那麼 Rust 滿足這個要求。在代碼中不同的部分使用 `pub` 與否可以封裝其實現細節。

## 繼承，作為類型系統與代碼共享

**繼承**（*Inheritance*）是一個很多程式語言都提供的機制，一個對象可以定義為繼承另一個對象的定義，這使其可以獲得父對象的數據和行為，而無需重新定義。

如果一個語言必須有繼承才能被稱為面向對象語言的話，那麼 Rust 就不是面向對象的。無法定義一個結構體繼承父結構體的成員和方法。然而，如果你過去常常在你的程式工具箱使用繼承，根據你最初考慮繼承的原因，Rust 也提供了其他的解決方案。

選擇繼承有兩個主要的原因。第一個是為了重用代碼：一旦為一個類型實現了特定行為，繼承可以對一個不同的類型重用這個實現。相反 Rust 代碼可以使用默認 trait 方法實現來進行共享，在範例 10-14 中我們見過在 `Summary` trait 上增加的 `summarize` 方法的默認實現。任何實現了 `Summary` trait 的類型都可以使用 `summarize` 方法而無須進一步實現。這類似於父類有一個方法的實現，而通過繼承子類也擁有這個方法的實現。當實現 `Summary` trait 時也可以選擇覆蓋 `summarize` 的默認實現，這類似於子類覆蓋從父類繼承的方法實現。

第二個使用繼承的原因與類型系統有關：表現為子類型可以用於父類型被使用的地方。這也被稱為 **多態**（*polymorphism*），這意味著如果多種對象共享特定的屬性，則可以相互替代使用。

> 多態（Polymorphism）
>
> 很多人將多態描述為繼承的同義詞。不過它是一個有關可以用於多種類型的代碼的更廣泛的概念。對於繼承來說，這些類型通常是子類。
> Rust 則透過泛型來對不同的可能類型進行抽象，並通過 trait bounds 對這些類型所必須提供的內容施加約束。這有時被稱為 *bounded parametric polymorphism*。

近來繼承作為一種語言設計的解決方案在很多語言中失寵了，因為其時常帶有共享多於所需的代碼的風險。子類不應總是共享其父類的所有特徵，但是繼承卻始終如此。如此會使程式設計更為不靈活，並引入無意義的子類方法調用，或由於方法實際並不適用於子類而造成錯誤的可能性。某些語言還只允許子類繼承一個父類，進一步限制了程式設計的靈活性。

因為這些原因，Rust 選擇了一個不同的途徑，使用 trait 對象而不是繼承。讓我們看一下 Rust 中的 trait 對象是如何實現多態的。

## 附錄 C：可派生的 trait

> [appendix-03-derivable-traits.md](https://github.com/rust-lang/book/blob/master/src/appendix-03-derivable-traits.md)
> <br />
> commit 426f3e4ec17e539ae9905ba559411169d303a031

在本書的各個部分中，我們討論了可應用於結構體和枚舉定義的 `derive` 屬性。`derive` 屬性會在使用 `derive` 語法標記的類型上生成對應 trait 的默認實現的代碼。

在本附錄中提供了標準庫中所有可以使用 `derive` 的 trait 的參考。這些部分涉及到：

* 該 trait 將會派生什麼樣的操作符和方法
* 由 `derive` 提供什麼樣的 trait 實現
* 由什麼來實現類型的 trait
* 是否允許實現該 trait 的條件
* 需要 trait 操作的例子

如果你希望不同於 `derive` 屬性所提供的行為，請查閱 [標準庫文件](https://doc.rust-lang.org/std/index.html) 中每個 trait 的細節以了解如何手動實現它們。

標準庫中定義的其它 trait 不能通過 `derive` 在類型上實現。這些 trait 不存在有意義的默認行為，所以由你負責以合理的方式實現它們。

一個無法被派生的 trait 的例子是為終端用戶處理格式化的 `Display` 。你應該時常考慮使用合適的方法來為終端用戶顯示一個類型。終端用戶應該看到類型的什麼部分？他們會找出相關部分嗎？對他們來說最相關的數據格式是什麼樣的？Rust 編譯器沒有這樣的洞察力，因此無法為你提供合適的默認行為。

本附錄所提供的可派生 trait 列表並不全面：庫可以為其自己的 trait 實現 `derive`，可以使用 `derive` 的 trait 列表事實上是無限的。實現 `derive` 涉及到過程宏的應用，這在第十九章的 [“宏”][macros] 有介紹。

### 用於程式設計師輸出的 `Debug`

`Debug` trait 用於開啟格式化字串中的除錯格式，其通過在 `{}` 占位符中增加 `:?` 表明。

`Debug` trait 允許以除錯目的來列印一個類型的實例，所以使用該類型的程式設計師可以在程序執行的特定時間點觀察其實例。

例如，在使用 `assert_eq!` 宏時，`Debug` trait 是必須的。如果等式斷言失敗，這個宏就把給定實例的值作為參數列印出來，如此程式設計師可以看到兩個實例為什麼不相等。

### 等值比較的 `PartialEq` 和 `Eq`

`PartialEq` trait 可以比較一個類型的實例以檢查是否相等，並開啟了 `==` 和 `!=` 運算符的功能。

派生的 `PartialEq` 實現了 `eq` 方法。當 `PartialEq` 在結構體上派生時，只有*所有* 的欄位都相等時兩個實例才相等，同時只要有任何欄位不相等則兩個實例就不相等。當在枚舉上派生時，每一個成員都和其自身相等，且和其他成員都不相等。

例如，當使用 `assert_eq!` 宏時，需要比較比較一個類型的兩個實例是否相等，則 `PartialEq` trait 是必須的。

`Eq` trait 沒有方法。其作用是表明每一個被標記類型的值等於其自身。`Eq` trait 只能應用於那些實現了 `PartialEq` 的類型，但並非所有實現了 `PartialEq` 的類型都可以實現 `Eq`。浮點類型就是一個例子：浮點數的實現表明兩個非數位（`NaN`，not-a-number）值是互不相等的。

例如，對於一個 `HashMap<K, V>` 中的 key 來說， `Eq` 是必須的，這樣 `HashMap<K, V>` 就可以知道兩個 key 是否一樣了。

### 次序比較的 `PartialOrd` 和 `Ord`

`PartialOrd` trait 可以基於排序的目的而比較一個類型的實例。實現了 `PartialOrd` 的類型可以使用 `<`、 `>`、`<=` 和 `>=` 操作符。但只能在同時實現了 `PartialEq` 的類型上使用 `PartialOrd`。

派生 `PartialOrd` 實現了 `partial_cmp` 方法，其返回一個 `Option<Ordering>` ，但當給定值無法產生順序時將返回 `None`。儘管大多數類型的值都可以比較，但一個無法產生順序的例子是：浮點類型的非數字值。當在浮點數上調用 `partial_cmp` 時，`NaN` 的浮點數將返回 `None`。

當在結構體上派生時，`PartialOrd` 以在結構體定義中欄位出現的順序比較每個欄位的值來比較兩個實例。當在枚舉上派生時，認為在枚舉定義中聲明較早的枚舉變體小於其後的變體。

例如，對於來自於 `rand` crate 中的 `gen_range` 方法來說，當在一個大值和小值指定的範圍內生成一個隨機值時，`PartialOrd` trait 是必須的。

`Ord` trait 也讓你明白在一個帶註解類型上的任意兩個值存在有效順序。`Ord` trait 實現了 `cmp` 方法，它返回一個 `Ordering` 而不是 `Option<Ordering>`，因為總存在一個合法的順序。只可以在實現了 `PartialOrd` 和 `Eq`（`Eq` 依賴 `PartialEq`）的類型上使用 `Ord` trait 。當在結構體或枚舉上派生時， `cmp` 和以 `PartialOrd` 派生實現的 `partial_cmp` 表現一致。

例如，當在 `BTreeSet<T>`（一種基於有序值存儲數據的數據結構）上存值時，`Ord` 是必須的。

### 複製值的 `Clone` 和 `Copy`

`Clone` trait 可以明確地創建一個值的深拷貝（deep copy），複製過程可能包含任意代碼的執行以及堆上數據的複製。查閱第四章 [“變數和數據的交互方式：移動”][ways-variables-and-data-interact-clone]  以獲取有關 `Clone` 的更多訊息。

派生 `Clone` 實現了 `clone` 方法，其為整個的類型實現時，在類型的每一部分上調用了 `clone` 方法。這意味著類型中所有欄位或值也必須實現了 `Clone`，這樣才能夠派生 `Clone` 。

例如，當在一個切片（slice）上調用 `to_vec` 方法時，`Clone` 是必須的。切片並不擁有其所包含實例的類型，但是從 `to_vec` 中返回的 vector 需要擁有其實例，因此，`to_vec` 在每個元素上調用 `clone`。因此，存儲在切片中的類型必須實現 `Clone`。

`Copy` trait 允許你透過只拷貝存儲在棧上的位來複製值而不需要額外的代碼。查閱第四章 [“只在棧上的數據：拷貝”][stack-only-data-copy] 的部分來獲取有關 `Copy` 的更多訊息。

`Copy` trait 並未定義任何方法來阻止編程人員重寫這些方法或違反不需要執行額外代碼的假設。儘管如此，所有的程式人員可以假設複製（copy）一個值非常快。

可以在類型內部全部實現 `Copy` trait 的任意類型上派生 `Copy`。 但只可以在那些同時實現了 `Clone` 的類型上使用 `Copy` trait ，因為一個實現了 `Copy` 的類型也簡單地實現了 `Clone`，其執行和 `Copy` 相同的任務。

`Copy` trait 很少使用；實現 `Copy` 的類型是可以最佳化的，這意味著你無需調用 `clone`，這讓代碼更簡潔。

任何使用 `Copy` 的代碼都可以通過 `Clone` 實現，但代碼可能會稍慢，或者不得不在代碼中的許多位置上使用 `clone`。

### 固定大小的值到值映射的 `Hash`

`Hash` trait 可以實例化一個任意大小的類型，並且能夠用哈希（hash）函數將該實例映射到一個固定大小的值上。派生 `Hash` 實現了 `hash` 方法。`hash` 方法的派生實現結合了在類型的每部分調用 `hash` 的結果，這意味著所有的欄位或值也必須實現了 `Hash`，這樣才能夠派生 `Hash`。

例如，在 `HashMap<K, V>` 上存儲數據，存放 key 的時候，`Hash` 是必須的。

### 預設值的 `Default`

`Default` trait 使你創建一個類型的預設值。 派生 `Default` 實現了 `default` 函數。`default` 函數的派生實現調用了類型每部分的 `default` 函數，這意味著類型中所有的欄位或值也必須實現了 `Default`，這樣才能夠派生 `Default` 。

`Default::default` 函數通常結合結構體更新語法一起使用，這在第五章的 [“使用結構體更新語法從其他實例中創建實例”][creating-instances-from-other-instances-with-struct-update-syntax] 部分有討論。可以自訂一個結構體的一小部分欄位而剩餘欄位則使用 `..Default::default()` 設置為預設值。

例如，當你在 `Option<T>` 實例上使用 `unwrap_or_default` 方法時，`Default` trait是必須的。如果 `Option<T>` 是 `None`的話, `unwrap_or_default` 方法將返回存儲在 `Option<T>` 中 `T` 類型的 `Default::default` 的結果。

[creating-instances-from-other-instances-with-struct-update-syntax]:
ch05-01-defining-structs.html#creating-instances-from-other-instances-with-struct-update-syntax
[stack-only-data-copy]:
ch04-01-what-is-ownership.html#stack-only-data-copy
[ways-variables-and-data-interact-clone]:
ch04-01-what-is-ownership.html#ways-variables-and-data-interact-clone
[macros]: ch19-06-macros.html#macros

# Rust 程式設計語言（第二版 & 2018 edition） 簡體中文版

[![Build Status](https://travis-ci.org/KaiserY/trpl-zh-cn.svg?branch=master)](https://travis-ci.org/KaiserY/trpl-zh-cn)

## 狀態

2018 edition 的翻譯遷移已基本完成，歡迎閱讀學習！

PS:

* 對照原始碼位置：[https://github.com/rust-lang/book/tree/master/src][source]
* 每章翻譯開頭都帶有官方連結和 commit hash，若發現與官方不一致，歡迎 Issue 或 PR :)

[source]: https://github.com/rust-lang/book/tree/master/src

## 靜態頁面構建與文件撰寫

![image](./vuepress_page.png)

### 構建

你可以將本 mdbook 構建成一系列靜態 html 頁面。這裡我們採用 [vuepress](https://vuepress.vuejs.org/zh/) 打包出靜態網頁。在這之前，你需要安裝 [Nodejs](https://nodejs.org/zh-cn/)。

全局安裝 vuepress

``` bash
npm i -g vuepress
```

cd 到項目目錄，然後開始構建。構建好的靜態文件會出現在 "./src/.vuepress/dist" 中

```bash
vuepress build ./src
```

### 文件撰寫

vuepress 會啟動一個本地伺服器，並在瀏覽器對你保存的文件進行即時熱更新。

```bash
vuepress dev ./src
```

## 社區資源

- Rust語言中文社區：<https://rust.cc/>
- Rust 中文 Wiki：<https://wiki.rust-china.org/>
- Rust程式語言社區主群：303838735
- Rust 水群：253849562

## GitBook

本翻譯主要採用 [mdBook](https://github.com/rust-lang-nursery/mdBook) 格式。同時支持 [GitBook](https://github.com/GitbookIO/gitbook)，但會缺失部分功能，如一些程式碼沒有語法高亮。

本翻譯加速查看站點有：
 - 深圳站點：<http://120.78.128.153/rustbook>

[GitBook.com](https://www.gitbook.com/) 地址：<https://legacy.gitbook.com/book/kaisery/trpl-zh-cn/details>

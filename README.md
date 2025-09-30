# Backloght
ティラノスクリプトのバックログをセーブデータ毎に保存するようにし、高速で汎用的なバックログジャンプ機能を実現するプラグイン。

## 概要

本プラグインはorukRed氏の[tyrano-backlog-jump](https://github.com/orukRed/tyrano-backlog-jump)プラグインに多数の改造を施して制作されています。

元のプラグイン同様、ティラノスクリプトの処理を一部改造しています。
そのため、このプラグインを導入することで他のプラグインが正常に動作しなくなったり、動作に不具合が生じたりする場合があります。

## 導入方法

1. data/others/plugin/Backloghtフォルダを全て`「data/others/plugin/」` へ入れてください。
2. `first.ks` 等のゲーム起動時に必ず通過するシナリオファイルに `[plugin name="Backloght"]` を記述しプラグインを読み込みます。バックログにシナリオを書き込む前に本プラグインを読み込んでください。

## 機能・使い方

### セーブデータ毎のバックログ管理機能
ティラノスクリプトの標準バックログは、一時変数`tf`で管理されており、ゲームを再起動する度に削除されます。<br>
このプラグインを導入することで、セーブ時に現在のバックログを保存するようになります。

### バックログからのシーンジャンプ機能
シナリオの頭に`[blj_record_start]`と宣言すると、バックログにシーンジャンプボタンが挿入されます。<br>
以降、`[p]`の代わりに`[n]`タグを使うことで、ページ切り替えの度にバックログにシーンジャンプボタンが挿入されます。
ログからシーンジャンプボタンをクリックすると、その該当地点に戻ることができます。
バックログもジャンプ先のデータに従い、復元されます。

`[blj_record_stop]`を宣言すると、再び開始タグが宣言されるまで、シーンジャンプボタンが置かれなくなります。

## オプション
`init.ks`内にある以下のオプションを変更することで、ある程度のカスタマイズができます。
```js:sample
//各種オプション
sf.blj = {
  
  //◆バックログジャンプボタンとして挿入する文字列
  //htmlタグを使うことで画像なども挿入可能です
  //default: "↪"
  pushtext:"↪",
  
  //◆バックログジャンプで戻れるメッセージの数。
  //デフォルトはconfig.tjsのバックログ上限の設定に合わせます。
  //default: tyrano.plugin.kag.config.maxBackLogNum
  maxSaveFileNum: tyrano.plugin.kag.config.maxBackLogNum,

  //◆バックログジャンプする際に出す確認ダイアログの文字
  //default: "この位置にジャンプしますか？"
  confirmText: "この位置にジャンプしますか？"

  
}
```


## 改造箇所

改造した関数は以下です。

|  関数名  | 主な改造内容 |
| ---- | ---- |
|  tyrano.plugin.kag.menu.displayLog  |シーンジャンプボタンをクリックできるようにし、クリックした地点へとジャンプできる処理を追加|
|  tyrano.plugin.kag.menu.doSave<br>tyrano.plugin.kag.menu.setQuickSave<br> tyrano.plugin.kag.menu.doSetAutoSave |バックログのデータをセーブする処理を追加  |
|  tyrano.plugin.kag.tag.savesnap<br>tyrano.plugin.kag.menu.snapSave<br>  | flag_thumb属性を追加し、これがfalseだとセーブ時に現在の画面のスクリーンショットを保存しないように機能を拡張  |
|  tyrano.plugin.kag.menu.loadGameData  |ゲームロード時にそのデータに保存されたバックログ情報を読み込む処理を追加  |
|  tyrano.plugin.kag.tag.awakegame  |  `[awakegame]`でゲームを再開した際、バックログをロードしないように例外処理を追加 |


## 動作確認

ティラノスクリプト V603

## 免責

このプラグインを使用したことにより生じた損害・損失に対して制作者は一切責任を負いません。

## 利用規約

- 改造は自由です。無改造での再配布はお控えください。

## 製作者
- [Waku](https://x.com/genzeLive)
- [筑波大学現代視覚文化研究会美少女ゲーム制作班「Philia」](https://github.com/tsukuba-GSK-bishoge)


## issues

バグなどを見つけたもしくは不明点がある場合、以下のいずれかでご連絡ください。

- [X(@tsukuba_bishojo)でリプライやDM](https://x.com/tsukuba_bishojo)
- Githubにissueを立てる（バグのみ）

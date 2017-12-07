# BOT 開発者向け LINE シミュレーター
LINE Bot 開発は楽しいけど、動作確認に実機を使うのは面倒だという私のような開発者の方向けに、シミュレーターを提供します。これで開発、テスト、リリースまでの生産性が向上することを願って。

## 前提条件
- LINE 開発者アカウント
- node.js
- 開発中の LINE Bot アプリ
- **Chrome でしかテストしてません。**

## シミュレーターのセットアップ
```
git clone https://github.com/kenakamu/LINESimulator
npm install
npm start
```
MacOS を使っている場合は手動でブラウザを開いて、http://localhost:8080 に接続してください。

# 動作原理
このアプリは LINE クライアントのシミュレーターとして機能すると同時に、LINE プラットフォームのシミュレーターとしても機能します。Bot アプリからの送信はすべてのこのシミュレーターに送信され、必要に応じて LINE プラットフォームに転送されます。そして結果がシミュレーターの画面に表示されます。

## Bot アプリにシミュレーターの URL を設定
1. 上記手順に沿ってセットします。既定でポート 8080 を使いますが変えたい場合は自由にコードを変えてください。
1. Bot アプリで http://localhost:8080 を LINE URL として指定します。使っている言語によってやり方が多少異なります。

**C#**: URL を LineMessagingClient コンストラクタに渡します。
```csharp
var lineMessagingClient = new LineMessagingClient(accessToken, "http://localhost:8080");
``` 
**Golang**: URL を linebot.New に渡します。
```go
bot, err := linebot.New(
		channelSecret,
		channelToken,
		"http://localhost:8080"
	)
```
**python**: URL を linebot.LineBotApi コンストラクタに渡します。 
```python
line_bot_api = LineBotApi(channel_access_token, "http://localhost:8080")
```
**Node.js**: node.js の場合は URL の最後に /bot を付けて、 process.env.API_BASE_URL に渡します。ソースコードに埋め込む場合は、@line/bot-sdk を読み込む前に設定してください。
```javascript
process.env.API_BASE_URL = "http://localhost:8080/bot";
const line = require('@line/bot-sdk');
```

## 使い方
1. Chrome を開いて http://localhost:8080 に接続。
1. 接続ページが出るので、必要な値を入力して、"connect" をクリック。<br/>![settings.png](readme_img/settings.PNG)
1. チャットバーにメッセージを入れて、Enter キー押下または送信アイコンをクリック。<br/>![chatbar.png](readme_img/chatbar.PNG)
1. 返信を確認。<br/>![chatreply.png](readme_img/chatreply.PNG)

## 設定の更新
1. 設定アイコンをクリック。
1. 必要な変更を行って、connect をクリック。

自分以外の LINE ユーザーID も指定できるので、他ユーザーの挙動も確認できます。

## 拡大/縮小
1. ズームアイコンをクリック。<br/>![zoom.png](readme_img/zoom.PNG)
1. シミュレーターのみ拡大、縮小されることを確認。

ページ全体の倍率変更はブラウザの機能で実行してください。

## キーボード
キーボードが出ると画面に見え方が変わります。以下の手順でキーボードを出せます。ただし入力はできません。
1. チャットバーかメニューのキーボードアイコンをクリック。<br/>![keyboard.png](readme_img/keyboard.PNG)
1. キーボードが出ることを確認。<br/>![withkeyboard.png](readme_img/withkeyboard.PNG)

## テキスト以外の送信
1. チャットバーかメニューの右矢印アイコンをクリック。 <br/>![more.png](readme_img/more.PNG)
1. 表示されるメニューで必要なものを送信。画像やステッカーのほか、場所やフォローなどシステムメッセージも送信可能。<br/>![moremenu.png](readme_img/moremenu.PNG)

## JSON の表示
1. 画面上のアイテムをクリック。
1. 対応する JSON が確認可能<br/>![confirmjson.png](readme_img/confirmjson.PNG)
1. 閉じるアイコンで閉じる。

# 機能
現時点でシミュレーターは以下の機能を提供:
- テキスト、画像、動画、場所、ステッカー、システムイベントの送信
- テキスト返信の表示
- 画像/動画返信の表示
- ボタン、確認、カルーセルテンプレート返信の表示
- テンプレートのアクションをハンドル (URI アクション以外)

## シミュレーターサイズの変更
現時点では手動で CSS の変更が必要。public/css/site.css の上部にある変数を変更して調整してください。

## 追加したい機能
- 日付ピッカー
- URI アクション
- リッチメニュー
- iPhone X/iPhone 8/Xperia XZ1 等のサイズの簡単な選択

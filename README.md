# AutoModUpdater
AutoModupdater for Hypixel Skyblock

# 使い方 
Node.js持ってないならだうんろーどしてね。
ダウンロードが終わったら、コマンドプロンプトを開いて、これを入力してね
```
npm i axios@0.21.4 -g
```
"アップデートしたいMOD"フォルダにアップデートしたいModを入れて終わりです。

# 絶対読んでね！？
ClientID、ClientSecretを使わないなら、42行目を
```javascript
const fileurl = `${url.filter(file => file.endsWith('.jar'))[0].toString()}`;
```
こうしてください。

あと、5, 7, 8行目を消してください

# やること
頑張ってModリストは更新していきます。

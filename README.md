# AutoModUpdater
AutoModupdater for Hypixel Skyblock

# 使い方 
Node.js持ってないならだうんろーどしてね。
ダウンロードが終わったら、コマンドプロンプトを開いて、これを入力してね
```
npm i axios@0.21.4 -g
```
```
npm i fs-extra -g
```
"アップデートしたいMOD"フォルダにアップデートしたいModを入れて終わりです。

# 絶対読んでね！？
ClientID、ClientSecretを使わないなら、42行目と56行目を
```javascript
//46行目
const fileurl = `${url.filter(file => file.endsWith('.jar'))[0].toString()}`;

//56行目
path: `/repos/${owner}/${repo}/releases/latest`,
```
こうしてください。

あと、5, 7, 8行目を消してください

# やること
頑張ってModリストは更新していきます。

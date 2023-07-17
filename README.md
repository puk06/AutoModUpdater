# AutoModUpdater
Modupdater for skyblock

# How to use 
Simply put the mod files you want to update in the "アップデートしたいMOD" folder and run

"アップデートしたいMOD"フォルダにアップデートしたいModを入れて終わりです。

# Important
ClientID、ClientSecretを使わないなら、42行目を
```javascript
const fileurl = `${url.filter(file => file.endsWith('.jar'))[0].toString()}`;
```

あと、5, 7, 8行目を消してください

# TO do
頑張ってModリストは更新していきます。

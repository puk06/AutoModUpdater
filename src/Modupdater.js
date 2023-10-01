const fs = require('./node_modules/fs-extra');
const axios = require('./node_modules/axios');
const path = require('path');
const readlineSync = require('./node_modules/readline-sync');

async function main() {
    const wannaupdatemod = [];
    let modlist = [];
    modlist = wannaupdatemod
    fs.readdirSync("./アップデートしたいMOD").forEach(file => {
        wannaupdatemod.push(path.basename(file))
    })

    const rawjsondata = fs.readFileSync('./src/UpdateLinks.json', 'utf-8')
    const jsondata = JSON.parse(rawjsondata);

    console.log("\n---------------------------------------------------------------------------------\n")
    console.log("アップデート後フォルダのリセット中です")
    fs.rmSync("./アップデート後", { recursive: true })
    fs.mkdirSync("./アップデート後")
    console.log("アップデート後フォルダのリセットが完了しました")
    console.log("\n---------------------------------------------------------------------------------\n")

    console.log("Modファイルのダウンロード中です")
    let count = 0;
    let NotEnoughUpdateFlag = false;
    let NotEnoughUpdatesFilename = "";
    for (const element of wannaupdatemod) {
        if (element.includes("NotEnoughUpdates")) {
            console.log("※NotEnoughUpdatesはGithubのアップデートが1年前なので、最新版を公式Discordからダウンロードしてください。");
            console.log("※Discord: https://discord.gg/moulberry")
            modlist = modlist.filter(mod => mod !== element)
            NotEnoughUpdateFlag = true;
            NotEnoughUpdatesFilename = element;
            continue;
        }

        for (const json of jsondata) {
            if (!element.includes(json.name) && !element.includes("NotEnoughUpdates")) {
                continue;
            } else {
                console.log(`${json.name}をアップデート中です`)
                const owner = json.link.split('/')[0];
                const repo = json.link.split('/')[1];
                await downloadFile(owner, repo);
                count++;
                modlist = modlist.filter(mod => mod !== element)
                console.log(`${json.name}のアップデートが完了しました(${element})`)
            }
        }
    }

    console.log(`Modファイルのアップデートが完了しました(${count}個)`)
    console.log("\n---------------------------------------------------------------------------------\n")
    for (const mod of modlist) {
        console.log(`${mod}の自動アップデートに失敗しました。Githubで検索しますか？`)
        console.log("検索する場合はyを、しない場合はnを入力してください。")
        const answer = readlineSync.question("y or n: ");
        if (answer == "y") {
            console.log(`${mod.split('-')[0]}を検索しています...`)
            console.log("\n---------------------------------------------------------------------------------\n")
            const searchdata = await searchMod(mod.split('-')[0]);
            let itemlist = [];
            if (searchdata == null) {
                console.log("検索結果が見つかりませんでした。次のMODの検索に移ります。")
                console.log("\n---------------------------------------------------------------------------------\n")
                continue;
            }

            for (let i = 0; i < Math.min(searchdata.length, 10); i++) {
                itemlist.push(`[${i + 1}] ☆${searchdata[i].stargazers_count} | ${searchdata[i].full_name}(${searchdata[i].html_url})`)
            }
            console.log(itemlist.join("\n"))
            console.log("\n---------------------------------------------------------------------------------\n")
            console.log("これらが見つかりました。もし検索結果の中にModがあればその番号を、なかった場合はnを入力してください。※偽物やRatに気をつけてください")
            const answer = readlineSync.question('Number or n: ');
            if (answer == "n") {
                console.log("次のMODの検索に移ります。")
                console.log("\n---------------------------------------------------------------------------------\n")
                continue;
            } else if (answer <= itemlist.length) {
                const owner = searchdata[answer - 1].full_name.split('/')[0];
                const repo = searchdata[answer - 1].full_name.split('/')[1];
                console.log(`${searchdata[answer - 1].name}をアップデート中です`)
                const downloadfile = await downloadFile(owner, repo);
                if (downloadfile == "error") {
                    console.log(`${searchdata[answer - 1].name}のアップデートに失敗しました。リリースが無い可能性があります。`)
                    console.log("\n---------------------------------------------------------------------------------\n")
                    continue;
                }
                count++;
                modlist = modlist.filter(moditem => moditem !== mod)
                console.log(`${searchdata[answer - 1].name}のアップデートが完了しました(${mod})。`)
                console.log("この選択をModリストに追加しておきますか？追加するならyを、しないならnを入力してください。")
                const answerlink = readlineSync.question("y or n: ");
                if (answerlink == "y") {
                    jsondata.push({
                        name: searchdata[answer - 1].name,
                        link: searchdata[answer - 1].full_name
                    })
                    fs.writeFileSync('./src/UpdateLinks.json', JSON.stringify(jsondata, null, 4));
                    console.log(`${searchdata[answer - 1].name}をModリストに追加しました。`)
                } else if (answer == "n") {
                    continue;
                } else {
                    console.log("yかnを入力してください。次のMODの検索に移ります。")
                    continue;
                }

                console.log("\n---------------------------------------------------------------------------------\n")
                continue;
            } else if (answer > itemlist.length) {
                console.log("入力された番号が検索結果の範囲外です。次のMODの検索に移ります。")
                console.log("\n---------------------------------------------------------------------------------\n")
                continue;
            } else {
                console.log("入力された文字が不正です。次のMODの検索に移ります。")
                console.log("\n---------------------------------------------------------------------------------\n")
            }
        } else if (answer == "n") {
            continue;
        } else {
            console.log("yかnを入力してください。次のMODの検索に移ります。")
            console.log("\n---------------------------------------------------------------------------------\n")
            continue;
        }
    }

    if (NotEnoughUpdateFlag) modlist.push(NotEnoughUpdatesFilename);

    for (const mod of modlist) {
        fs.copyFileSync(`./アップデートしたいMOD/${mod}`, `./アップデート後/${mod}`)
    }
    
    console.log(`アップデートできなかったMOD(${wannaupdatemod.length - count}個)\n${modlist.join("\n")}`)
    console.log("\n---------------------------------------------------------------------------------\n")
    console.log(`すべての処理が終了したため、5秒後に画面を閉じます`)
    console.log("\n---------------------------------------------------------------------------------\n")

    setTimeout(() => {
        process.exit();
    }, 5000);

    async function downloadFile(owner, repo) {
        const url = await getLatestReleaseFiles(owner, repo);
        if (url == null) {
            return "error";
        }
        const fileurl = url.filter(file => file.endsWith('.jar'))[0].toString();
        const dest = `./アップデート後/${url[0].split('/')[url[0].split('/').length - 1]}`;
        const res = await axios.get(fileurl, {responseType: 'arraybuffer'});
        fs.writeFileSync(dest, res.data, 'UTF-8');
        return "Success";
    };

    async function getLatestReleaseFiles(owner, repo) {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)
            if (response.status === 200) {
                const release = response.data;
                const files = release.assets.map(asset => asset.browser_download_url);
                return files;
            } else {
                throw new Error(`GitHub APIエラー: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            return null;
        }
    }

    async function searchMod(modname) {
        const url = `https://api.github.com/search/repositories?q=${modname}`;
        const res = await axios.get(url);
        if (res.data.total_count == 0) {
            return null;
        }
        return res.data.items;
    }
}

async function maindelay() {
    await main();
    setTimeout(() => {
        process.exit();
    }, 5000);
}

maindelay()

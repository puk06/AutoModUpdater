const fs = require('./node_modules/fs-extra');
const axios = require('./node_modules/axios');
const path = require('path');
const readlineSync = require('./node_modules/readline-sync');
require('dotenv').config();

const githubclientid = process.env.GITHUB_CLIENT_ID;
const githubclientsecret = process.env.GITHUB_CLIENT_SECRET;

async function main() {
    const wannaupdatemod = [];
    let modlist = [];
    modlist = wannaupdatemod
    fs.readdirSync("./アップデートしたいMOD").forEach(file => {
        wannaupdatemod.push(path.basename(file))
    })

    const rawjsondata = fs.readFileSync('UpdateLinks.json', 'utf-8')
    const jsondata = JSON.parse(rawjsondata);

    console.log("---------------------------------------------------------------------------------")
    console.log("アップデート後フォルダのリセット中です")
    fs.rmSync("./アップデート後", { recursive: true })
    fs.mkdirSync("./アップデート後")
    console.log("アップデート後フォルダのリセットが完了しました")
    console.log("---------------------------------------------------------------------------------")

    console.log("Modファイルのダウンロード中です")
    let count = 0;
    for(const element of wannaupdatemod) {
        for(const json of jsondata) {
            if (!element.includes(json.name)) {
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
    console.log("---------------------------------------------------------------------------------")
    for (const mod of modlist) {
        console.log(`${mod}の自動アップデートに失敗しました。Githubで検索しますか？`)
        console.log("検索する場合はyを、しない場合はnを入力してください。")
        const answer = readlineSync.question("y or n: ");
        if (answer == "y") {
            console.log(`${mod.split('-')[0]}を検索しています...`)
            console.log("---------------------------------------------------------------------------------")
            const searchdata = await searchMod(mod.split('-')[0]);
            let itemlist = [];
            if (searchdata == null) {
                console.log("検索結果が見つかりませんでした。次のMODの検索に移ります。")
                console.log("---------------------------------------------------------------------------------")
                continue;
            }

            for (let i = 0; i < Math.min(searchdata.length, 10); i++) {
                itemlist.push(`[${i + 1}] ☆${searchdata[i].stargazers_count} | ${searchdata[i].full_name}(${searchdata[i].html_url})`)
            }
            console.log(itemlist.join("\n"))
            console.log("---------------------------------------------------------------------------------")
            console.log("これらが見つかりました。もし検索結果の中にModがあればその番号を、なかった場合はnを入力してください。")
            const answer = readlineSync.question('Number or n: ');
            if (answer == "n") {
                console.log("次のMODの検索に移ります。")
                console.log("---------------------------------------------------------------------------------")
                continue;
            } else if (answer <= itemlist.length){
                const owner = searchdata[answer - 1].full_name.split('/')[0];
                const repo = searchdata[answer - 1].full_name.split('/')[1];
                console.log(`${searchdata[answer - 1].name}をアップデート中です`)
                const downloadfile = await downloadFile(owner, repo);
                if (downloadfile == null) {
                    console.log(`${searchdata[answer - 1].name}のアップデートに失敗しました。リリースが無い可能性があります。`)
                    console.log("---------------------------------------------------------------------------------")
                    continue;
                }
                count++;
                modlist = modlist.filter(moditem => moditem !== mod)
                console.log(`${searchdata[answer - 1].name}のアップデートが完了しました(${mod})。`)
                console.log("---------------------------------------------------------------------------------")
                continue;
            } else if (answer > itemlist.length) {
                console.log("入力された番号が検索結果の範囲外です。次のMODの検索に移ります。")
                console.log("---------------------------------------------------------------------------------")
                continue;
            } else {
                console.log("入力された文字が不正です。次のMODの検索に移ります。")
                console.log("---------------------------------------------------------------------------------")
            }
        } else if (answer == "n") {
            continue;
        } else {
            console.log("yかnを入力してください。次のMODの検索に移ります。")
            console.log("---------------------------------------------------------------------------------")
            continue;
        }
    }

    for (const mod of modlist) {
        fs.copyFileSync(`./アップデートしたいMOD/${mod}`, `./アップデート後/${mod}`)
    }

    console.log(`アップデートできなかったMOD(${wannaupdatemod.length - count}個)\n${modlist.join("\n")}`)
    console.log("---------------------------------------------------------------------------------")
    console.log(`すべての処理が終了したため、5秒後に画面を閉じます`)
    console.log("---------------------------------------------------------------------------------")

    setTimeout(() => {
        process.exit();
    }, 5000);

    async function downloadFile(owner, repo) {
        const url = await getLatestReleaseFiles(owner, repo);
        if (url == null) {
            return null;
        }
        const fileurl = `${url.filter(file => file.endsWith('.jar'))[0].toString()}?&client_id=${githubclientid}&client_secret=${githubclientsecret}`;
        const dest = `./アップデート後/${url[0].split('/')[url[0].split('/').length - 1]}`;
        const res = await axios.get(fileurl, {responseType: 'arraybuffer'});
        fs.writeFileSync(dest, res.data, 'UTF-8');
    };

    async function getLatestReleaseFiles(owner, repo) {
        try {
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
                    headers: {
                'User-Agent': 'request',
                Accept: 'application/vnd.github.v3+json'
                },
                params: {
                client_id: githubclientid,
                client_secret: githubclientsecret
                }
            });
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
        const url = `https://api.github.com/search/repositories?q=${modname}&client_id=${githubclientid}&client_secret=${githubclientsecret}`;
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

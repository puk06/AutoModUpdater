const fs = require('fs');
const https = require('https');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const githubclientid = process.env.GITHUB_CLIENT_ID;
const githubclientsecret = process.env.GITHUB_CLIENT_SECRET;

const wannaupdatemod = [];
fs.readdirSync("./アップデートしたいMOD").forEach(file => {
    wannaupdatemod.push(path.basename(file))
})

const rawjsondata = fs.readFileSync('UpdateLinks.json', 'utf-8')
const jsondata = JSON.parse(rawjsondata);

console.log("アップデート後フォルダのリセット中です")
fs.rmSync("./アップデート後", { recursive: true })
fs.mkdirSync("./アップデート後")
console.log("アップデート後フォルダのリセットが完了しました")

console.log("Modファイルのダウンロード中です")
let count = 0;
for(const element of wannaupdatemod) {
    for(const json of jsondata) {
        if (!element.includes(json.name)) {
            continue;
        } else {
            console.log(`${json.name}をアップデート中です。`)
            const owner = json.link.split('/')[0];
            const repo = json.link.split('/')[1];
            downloadFile(owner, repo);
            count++;
            console.log(`${json.name}のアップデートが完了しました。`)
        }
    }
}

console.log(`全てのMODファイルのアップデートが完了しました。(アップデートできなかったMODは${wannaupdatemod.length - count}個です)。\n5秒後に画面を閉じます。`)
setTimeout(() => {
    process.exit();
}, 5000);

async function downloadFile(owner, repo) {
    const url = await getLatestReleaseFiles(owner, repo);
    const fileurl = `${url.filter(file => file.endsWith('.jar'))[0].toString()}?&client_id=${githubclientid}&client_secret=${githubclientsecret}`;
    const dest = `./アップデート後/${url[0].split('/')[url[0].split('/').length - 1]}`;
    const res = await axios.get(fileurl, {responseType: 'arraybuffer'});
    fs.writeFileSync(dest, res.data, 'UTF-8');
};

function getLatestReleaseFiles(owner, repo) {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases/latest?&client_id=${githubclientid}&client_secret=${githubclientsecret}`,
        headers: {
            'User-Agent': 'request',
            Accept: 'application/vnd.github.v3+json'
        }
    };

    return new Promise((resolve, reject) => {
        https.get(options, response => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    const release = JSON.parse(data);
                    const files = release.assets.map(asset => asset.browser_download_url);
                    resolve(files);
                } else {
                    reject(new Error(`GitHub APIエラー: ${response.statusCode} ${response.statusMessage}`));
                }
            });
        }).on('error', error => {
            reject(error);
        });
    });
};

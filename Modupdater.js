const fs = require('fs');
const https = require('https');
const axios = require('axios');
const path = require('path');

const wannaupdatemod = [];
fs.readdirSync("./アップデートしたいMOD").forEach(file => {
    wannaupdatemod.push(path.basename(file))
})
console.log(wannaupdatemod)
const rawjsondata = fs.readFileSync('UpdateLinks.json', 'utf-8')
const jsondata = JSON.parse(rawjsondata);
console.log("ダウンロード中です")
console.log("0%")
let  percent = 0;
for(const element of jsondata) {
    console.log(Math.round(100 / jsondata.length * percent + 10) + "%");
    const owner = element.link.split('/')[0];
    const repo = element.link.split('/')[1];
    downloadFile(owner, repo)
    percent++;
}
console.log("100%")
console.log("ダウンロードが完了しました")

async function downloadFile(owner, repo) {
    const url = await getLatestReleaseFiles(owner, repo);
    const fileurl = url.filter(file => file.endsWith('.jar'))[0].toString();
    const dest = `./アップデート後/${url[0].split('/')[url[0].split('/').length - 1]}`;
    const res = await axios.get(fileurl, {responseType: 'arraybuffer'});
    fs.writeFileSync(dest, res.data, 'UTF-8');
};

function getLatestReleaseFiles(owner, repo) {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/releases/latest`,
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

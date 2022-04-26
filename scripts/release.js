require('dotenv').config();
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const { Octokit } = require("octokit");
const HttpsProxyAgent = require('https-proxy-agent');
const packageJson = require('../package.json');

const config = {
  owner: 'Press-One',
  repo: 'rum-app',
  tagName: `v${packageJson.version}`,
  commitHash: child_process.execSync('git rev-parse HEAD').toString().trim(),
  files: [
    {
      name: `RUM-${packageJson.version}.exe`,
      data: fs.readFileSync(path.join(__dirname, `../release/RUM-${packageJson.version}.exe`)),
    },
    {
      name: `RUM-${packageJson.version}.dmg`,
      data: fs.readFileSync(path.join(__dirname, `../release/RUM-${packageJson.version}.dmg`)),
    },
    {
      name: `RUM-${packageJson.version}.linux.zip`,
      data: fs.readFileSync(path.join(__dirname, `../release/RUM-${packageJson.version}.linux.zip`)),
    },
  ],
};

const main = async () => {
  const proxy = process.env.http_proxy || process.env.HTTP_PROXY;
  const proxyAgent = proxy ? new HttpsProxyAgent(proxy) : null;
  const octokit = new Octokit({
    auth: process.env.GITHUB_API_TOKEN,
    request: {
      agent: proxyAgent,
    },
  });

  const createOrGetRelease = async () => {
    try {
      console.log(`正在创建 release ${config.tagName}`);
      const newRelease = await octokit.rest.repos.createRelease({
        owner: config.owner,
        repo: config.repo,
        tag_name: config.tagName,
        target_commitish: config.commitHash,
        name: config.tagName,
      });
      return newRelease;
    } catch (e) {
      console.log(`创建 release ${config.tagName} 失败, 尝试寻找已有 release`);
    }

    try {
      const releases = await octokit.rest.repos.listReleases({
        owner: config.owner,
        repo: config.repo,
      });

      const release = releases.data.find(v => v.tag_name === config.tagName);

      if (!release) {
        console.log(`创建 release 失败, 并且未找到 tag 为 ${config.tagName} 的 release`);
        process.exit(1);
      }
      console.log(`找到 tag 为 ${config.tagName} 的 release`);
      return release;
    } catch (e) {
      console.log('查询已有release 失败!');
      console.log(e);
      process.exit(1);
    }
  };

  const uploadAssets = async (releaseId) => {
    let existingAssets;
    try {
      console.log('正在查询已有 assets');
      existingAssets = await octokit.rest.repos.listReleaseAssets({
        owner: config.owner,
        repo: config.repo,
        release_id: releaseId,
      });
    } catch (e) {
      console.log('查询已有 assets 失败!');
      console.log(e);
      process.exit(1);
    }

    for (let asset of existingAssets.data) {
      try {
        console.log(`正在删除已有 asset ${asset.name}`);
        await octokit.rest.repos.deleteReleaseAsset({
          owner: config.owner,
          repo: config.repo,
          asset_id: asset.id,
        });
      } catch (e) {
        console.log(`删除已有 asset ${asset.name} 失败!`);
        console.log(e);
        process.exit(1);
      }
    }

    for (let file of config.files) {
      try {
        console.log(`上传 ${file.name}`);
        await octokit.rest.repos.uploadReleaseAsset({
          owner: config.owner,
          repo: config.repo,
          release_id: releaseId,
          name: file.name,
          data: file.data,
        });
      } catch (e) {
        console.log(e)
        console.log(`上传 ${file.name} 失败!`);
        console.log(e);
        process.exit(1);
      }
    }
  };

  const release = await createOrGetRelease();
  uploadAssets(release.id);
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});

## 构建浏览器版本

系统中需要安装  [`golang`](https://go.dev/) 才能编译 wasm 文件。
**go 版本要求参考 [https://github.com/rumsystem/quorum](https://github.com/rumsystem/quorum)**

```sh
yarn
./scripts/build_wasm.sh #构建 wasm
yarn build:browser #构建浏览器版本
```

文件会输出到 src/dist 目录下。将此目录放到静态文件服务器即可。

**注意：服务器需要使用 `http` 而非 `https`，因为连接其他节点需要简历 `ws://` 协议的连接，而浏览器安全策略禁止从 https 域下简历非 tls 的连接。**

## lint
现在的 lint 是 eslint。tslint 早前被 [deprecated](https://github.com/palantir/tslint) 了，项目也迁移到了 [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)，目前 eslint 有完善的 ts 检查规则，几乎所有的 tslint 功能都有。

lint 发现的所有的错误不会阻塞 webpack 构建（方便调试，不然未使用变量这种报错也会阻塞构建），所以开发时需要看一眼控制台。

目前 eslint 配置了完善的语法语义检查和代码风格规则。所以 eslint 既是 linter 也是 formatter。

## 执行 lint 的方式
- `yarn start` 或 `yarn start:renderer` 时，启动 webpack 后，会启动 lint 服务输出报告到控制台
- 手动执行 `eslint ./src/ [--fix]` 会 lint src 下所有文件
- 配置 vscode 使用 eslint

## 配置 vscode 使用 eslint
1. 安装 [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) 扩展

2. 打开 vscode 设置 json 文件 (ctrl/cmd + shift + p 打开命令框，选择)

![image](https://user-images.githubusercontent.com/2271900/129650636-ed4c158d-1343-4f3d-9a5e-7a14801c7d9c.png)

3. 在设置里添加如下设置，为 js,jsx,ts,tsx 启用 eslint，并设置保存时自动应用 fix

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```
![image](https://user-images.githubusercontent.com/2271900/129658873-893df9cb-a277-4757-9ab7-d8b5631cad60.png)

4. 也可以使用 `eslint.executeAutofix` 这个命令 (Eslint: Fix all auto-fixable Problems)如果不想每次保存都格式化。功能是一样的。

5. .prettierignore 里排除了 jsx?/tsx?，因为和 eslint 会有冲突。

按照上面配置好后，写好代码 ctrl/cmd + s 保存一下就会自动格式化，会自动 fix 可以自动 fix 的错误（自动调整空格缩进分号等问题），不能 autofix 的才需要手动修复。

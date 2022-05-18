## Test

构建测试版本并执行测试
```sh
yarn build:test
yarn test
```

启动 dev server 并执行测试
```sh
yarn start:renderer
# start in another shell
yarn test
```


执行指定测试
```sh
# testname1 是测试文件名称的一部分
yarn test testname1 [testname2] ...
yarn test:dev testname1 [testname2] ...
```

`setup.ts` 包含了一个一键启动 electron 的函数，用户数据会保存到 `tests/tests/userData` 下，每次执行都会清空，生成新的用户数据。

执行测试时会设置一个环境变量和一个页面内全局变量用于区分测试环境，打开后应用会自动启动内置节点并把数据保存在 `tests/tests/userData/rum-user-data` 下。

## 写测试
在 `tests/tests/`下新建一个文件，将测试用例 `export default` 出来，测试时会自动执行。测试的名称为文件名。

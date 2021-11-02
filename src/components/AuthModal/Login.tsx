import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep, PrsAtm } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';
import { MdDone } from 'react-icons/md';
import { useHistory } from 'react-router-dom';

const pReadFile = util.promisify(fs.readFile);

export default observer(() => {
  const { snackbarStore, modalStore, accountStore } = useStore();
  const history = useHistory();
  const state = useLocalStore(() => ({
    keystore: null as any,
    accountName: '',
    password: '',
    loading: false,
    loadingKeystore: false,
  }));

  const submit = async () => {
    if (state.loading) {
      return;
    }
    state.loading = true;
    try {
      await sleep(500);
      const account: any = await PrsAtm.fetch({
        actions: ['atm', 'getAccount'],
        args: [state.accountName],
        logging: true,
        for: 'login',
      });
      const permissionKeys = accountStore.getPermissionKeys(account);
      if (!permissionKeys.includes(state.keystore.publickey)) {
        snackbarStore.show({
          message: '私钥文件和账户名不匹配，请再确认一下',
          type: 'error',
        });
        state.loading = false;
        return;
      }
      await PrsAtm.fetch({
        actions: ['wallet', 'recoverPrivateKey'],
        args: [state.password, state.keystore],
        minPending: 500,
      });
      accountStore.login(account, state.keystore, state.password);
      modalStore.auth.hide();
      if (accountStore.publicKeys.length === 1) {
        await sleep(200);
      } else {
        modalStore.pageLoading.show();
        await sleep(100);
        history.replace('/');
        await sleep(500);
        modalStore.pageLoading.hide();
      }
      history.replace('/dashboard');
      snackbarStore.show({
        message: '登录成功',
      });
    } catch (err) {
      console.log(err.message);
      if (err.message.includes('Account Not Found')) {
        snackbarStore.show({
          message: '账户名不存在，请再确认一下',
          type: 'error',
        });
      } else {
        snackbarStore.show({
          message: '密码错误，请重新输入',
          type: 'error',
        });
      }
    }
    state.loading = false;
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="p-8 px-12">
        <div className="w-65">
          <div className="text-gray-700 font-bold text-18 text-center">
            登录账号
          </div>
          <div className="mt-4 pt-2" />
          <Tooltip
            disableHoverListener={!!state.keystore}
            placement="top"
            title="选择保存在你电脑上的 keystore.json"
            arrow
          >
            <div>
              <Button
                fullWidth
                color={state.keystore ? 'green' : 'primary'}
                isDoing={state.loadingKeystore}
                onClick={async () => {
                  state.loadingKeystore = true;
                  try {
                    const file = await remote.dialog.showOpenDialog({
                      filters: [{ name: 'json', extensions: ['json'] }],
                      properties: ['openFile'],
                    });
                    if (!file.canceled && file.filePaths) {
                      const keystoreString = await pReadFile(
                        file.filePaths[0].toString(),
                        'utf8'
                      );
                      await sleep(500);
                      state.keystore = JSON.parse(keystoreString);
                    }
                  } catch (err) {
                    console.log(err.message);
                  }
                  state.loadingKeystore = false;
                }}
              >
                {state.keystore ? '私钥文件已选中' : '点击选择私钥文件'}
                {state.keystore && <MdDone className="ml-1 text-15" />}
              </Button>
            </div>
          </Tooltip>
          <div className="mt-3">
            <TextField
              className="w-full"
              placeholder="用户名"
              size="small"
              value={state.accountName}
              onChange={(e) => {
                state.accountName = e.target.value.toLocaleLowerCase();
              }}
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  e.target.blur();
                  submit();
                }
              }}
              margin="dense"
              variant="outlined"
            />
            <TextField
              className="w-full"
              type="password"
              placeholder="密码"
              size="small"
              value={state.password}
              onChange={(e) => {
                state.password = e.target.value;
              }}
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  e.target.blur();
                  submit();
                }
              }}
              margin="dense"
              variant="outlined"
            />
          </div>
          <div className="mt-6">
            <Button
              fullWidth
              isDoing={state.loading}
              disabled={!state.keystore || !state.password}
              onClick={submit}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Fade>
  );
});

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
        id: 'getAccount',
        actions: ['atm', 'getAccount'],
        args: [state.accountName],
      });
      const permissionKeys = accountStore.getPermissionKeys(account);
      if (!permissionKeys.includes(state.keystore.publickey)) {
        snackbarStore.show({
          message: '私钥文件和账户名不匹配',
          type: 'error',
        });
        state.loading = false;
        return;
      }
      await PrsAtm.fetch({
        id: 'recoverPrivateKey',
        actions: ['wallet', 'recoverPrivateKey'],
        args: [state.password, state.keystore],
      });
      accountStore.setAccount(account);
      accountStore.saveKeystore(state.password, state.keystore);
      modalStore.auth.hide();
      await sleep(100);
      history.replace('/account');
      snackbarStore.show({
        message: '登录成功',
      });
    } catch (err) {
      console.log(err);
      if (err.message.includes('Account Not Found')) {
        snackbarStore.show({
          message: '账户名不存在',
          type: 'error',
        });
      } else {
        snackbarStore.show({
          message: '密码错误',
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
                    console.log(err);
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
              placeholder="用户名，只能包含字母和数字1-5"
              size="small"
              value={state.accountName}
              onChange={(e) => {
                state.accountName = e.target.value;
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

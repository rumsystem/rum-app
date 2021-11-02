import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog, TextField } from '@material-ui/core';
import { useStore } from 'store';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep, PrsAtm } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';
import { MdDone } from 'react-icons/md';

const pReadFile = util.promisify(fs.readFile);

const Verification = observer(() => {
  const { snackbarStore, modalStore, accountStore } = useStore();
  const { isLogin } = accountStore;
  const state = useLocalStore(() => ({
    keystore: null as any,
    accountName: '',
    password: '',
    loading: false,
    done: false,
    loadingKeystore: false,
  }));

  const submit = async () => {
    if (state.loading) {
      return;
    }
    state.loading = true;
    state.done = false;
    try {
      if (!isLogin) {
        await sleep(200);
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
      }
      let keystore = null;
      if (isLogin) {
        await sleep(500);
        keystore = accountStore.getKeystore(
          state.password,
          accountStore.permissionKeys[0]
        );
        if (!keystore) {
          snackbarStore.show({
            message: '密码错误',
            type: 'error',
          });
          state.loading = false;
          return;
        }
      } else {
        keystore = state.keystore;
      }
      await PrsAtm.fetch({
        id: 'recoverPrivateKey',
        actions: ['wallet', 'recoverPrivateKey'],
        args: [state.password, keystore],
      });
      state.loading = false;
      state.done = true;
      await sleep(500);
      modalStore.verification.hide();
      modalStore.verification.pass();
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
      state.loading = false;
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="p-8 px-12">
        <div className={isLogin ? 'w-55' : 'w-65'}>
          <div className="text-gray-700 font-bold text-18 text-center">
            验证账号以继续操作
          </div>
          <div className="mt-4 pt-2" />
          {!isLogin && (
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
                      state.loadingKeystore = false;
                    } catch (err) {
                      console.log(err);
                    }
                  }}
                >
                  {state.keystore ? '私钥文件已选中' : '点击选择私钥文件'}
                  {state.keystore && <MdDone className="ml-1 text-15" />}
                </Button>
              </div>
            </Tooltip>
          )}
          <div className={isLogin ? '-mt-3' : 'mt-3'}>
            {!isLogin && (
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
            )}
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
              isDone={state.done}
              disabled={(!isLogin && !state.keystore) || !state.password}
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

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.verification;

  return (
    <Dialog
      open={open}
      onClose={() => modalStore.verification.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Verification />
    </Dialog>
  );
});

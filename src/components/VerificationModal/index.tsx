import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField, Checkbox } from '@material-ui/core';
import { useStore } from 'store';
import Dialog from 'components/Dialog';
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
  const { strict } = modalStore.verification;
  const state = useLocalStore(() => ({
    keystore: null as any,
    accountName: '',
    password: '',
    loading: false,
    done: false,
    loadingKeystore: false,
    shouldRememberMe: false,
  }));
  const showRememberMe = !strict && isLogin && !accountStore.hasPassword();

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
          actions: ['atm', 'getAccount'],
          args: [state.accountName],
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
      }
      let keystore = null;
      if (isLogin) {
        await sleep(500);
        keystore = accountStore.getKeystore(state.password);
        if (!keystore) {
          snackbarStore.show({
            message: '密码错误，请重新输入',
            type: 'error',
          });
          state.loading = false;
          return;
        }
      } else {
        keystore = state.keystore;
      }
      const resp: any = await PrsAtm.fetch({
        actions: ['wallet', 'recoverPrivateKey'],
        args: [state.password, keystore],
      });
      state.loading = false;
      state.done = true;
      await sleep(500);
      modalStore.verification.pass(
        resp.privatekey,
        state.accountName || accountStore.account.account_name
      );
      modalStore.verification.hide();
      if (state.shouldRememberMe) {
        accountStore.addPassword(state.password);
      }
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
                      console.log(err.message);
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
            )}
            {isLogin && showRememberMe && <div className="pt-3" />}
            <TextField
              className="w-full"
              type="password"
              placeholder="密码"
              size="small"
              value={state.password}
              autoFocus={isLogin}
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
            {showRememberMe && (
              <div className="flex">
                <Tooltip
                  placement="top"
                  title="将密码和私钥文件加密保存在你的电脑上，你就不再需要频繁地输入密码验证身份，请务必只在你自己的电脑上使用这个功能"
                  arrow
                >
                  <div
                    className="flex items-center"
                    onClick={() => {
                      state.shouldRememberMe = !state.shouldRememberMe;
                    }}
                  >
                    <Checkbox checked={state.shouldRememberMe} />
                    <span className="text-gray-88 mt-1-px text-13 cursor-pointer">
                      记住我，普通操作免验证
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
          <div className={showRememberMe ? 'mt-5' : 'mt-6'}>
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
  const { modalStore, accountStore } = useStore();
  const { open, strict } = modalStore.verification;
  const state = useLocalStore(() => ({
    openDialog: false,
  }));

  React.useEffect(() => {
    if (!open) {
      state.openDialog = false;
      return;
    }
    if (strict) {
      state.openDialog = true;
      return;
    }
    const password: any = accountStore.isLogin && accountStore.getPassword();
    if (!password) {
      state.openDialog = true;
      return;
    }
    (async () => {
      try {
        const keystore = accountStore.getKeystore(password);
        const resp: any = await PrsAtm.fetch({
          actions: ['wallet', 'recoverPrivateKey'],
          args: [password, keystore],
        });
        modalStore.verification.pass(
          resp.privatekey,
          accountStore.account.account_name
        );
        modalStore.verification.hide();
      } catch (err) {
        console.log(err.message);
        state.openDialog = true;
      }
    })();
  }, [strict, open]);

  return (
    <Dialog
      open={state.openDialog}
      onClose={() => {
        modalStore.verification.cancel();
        modalStore.verification.hide();
      }}
    >
      <Verification />
    </Dialog>
  );
});

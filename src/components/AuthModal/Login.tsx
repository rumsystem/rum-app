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
import Store from 'electron-store';

const pReadFile = util.promisify(fs.readFile);

export default observer(() => {
  const { snackbarStore, modalStore } = useStore();
  const state = useLocalStore(() => ({
    keystore: null as any,
    password: '',
    loading: false,
  }));

  const submit = async () => {
    state.loading = true;
    try {
      await sleep(600);
      await PrsAtm.fetch({
        id: 'recoverPrivateKey',
        actions: ['wallet', 'recoverPrivateKey'],
        args: [state.password, state.keystore],
      });
      const account: any = await PrsAtm.fetch({
        id: 'openAccount',
        actions: ['atm', 'openAccount'],
        args: [state.accountName, state.keystore.publickey],
      });
      console.log({ account });
      // const store = new Store();
      // store.set('keystores', [{ publickey: state.keystore.publickey }]);
      // const encryptedStore = new Store({
      //   name: 'encrypted_keystore',
      //   encryptionKey: state.password,
      // });
      // encryptedStore.set(state.keystore.publickey, state.keystore);
      modalStore.auth.hide();
      await sleep(100);
      snackbarStore.show({
        message: '已成功登录',
      });
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: '密码错误',
        type: 'error',
      });
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
          <div className="mt-6 pt-2" />
          <Tooltip
            disableHoverListener={state.keystore}
            placement="top"
            title="选择保存在你电脑上的 keystore.json"
            arrow
          >
            <div>
              <Button
                fullWidth
                color={state.keystore ? 'green' : 'primary'}
                onClick={async () => {
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
                      state.keystore = JSON.parse(keystoreString);
                    }
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
          <div className="mt-3">
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

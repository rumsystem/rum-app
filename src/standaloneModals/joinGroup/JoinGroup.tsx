import { useEffect } from 'react';
import fs, { readFile, stat, writeFile } from 'fs/promises';
import { ipcRenderer, shell } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import TOML from '@iarna/toml';
import {
  TextField, Tooltip, Button as MuiButton, FormControl,
  RadioGroup, FormControlLabel, Radio, IconButton,
} from '@mui/material';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { store, useStore } from 'store';
import { lang } from 'utils/lang';
import { sleep, isV2Seed, runLoading } from 'utils';
import { useJoinGroup } from 'hooks/useJoinGroup';
import rumsdk from 'rum-sdk-browser';
import { join } from 'path';
import { MdDelete } from 'react-icons/md';

export interface Props {
  seed?: string
  rs: () => unknown
}

export const JoinGroup = observer((props: Props) => {
  const { nodeStore } = store;
  const state = useLocalObservable(() => ({
    open: true,
    loading: false,
    done: false,
    loadingSeed: false,
    seed: props.seed ?? '',
    privateKey: {
      loading: false,
      open: false,
      disabledReason: 'unchecked' as 'unchecked' | 'unknown' | 'keyexisted' | 'notinternal' | 'loading' | '',
      mode: 'keystore' as 'privateKey' | 'keystore',
      privateKey: '',
      keystore: '',
      password: '',
      address: '',
    },
    get disabledReason() {
      if (this.privateKey.disabledReason === 'unchecked') {
        return '';
      }
      if (this.privateKey.disabledReason === 'unknown') {
        return '';
      }
      if (this.privateKey.disabledReason === 'loading') {
        return '处理中';
      }
      if (this.privateKey.disabledReason === 'keyexisted') {
        return '密钥已存在';
      }
      if (this.privateKey.disabledReason === 'notinternal') {
        return '非内部节点';
      }
      return '';
    },
  }));
  const { activeGroupStore, snackbarStore, groupStore } = useStore();
  const joinGroupProcess = useJoinGroup();

  const submit = async () => {
    if (state.loading) { return; }

    let seedJson: any;
    try {
      seedJson = isV2Seed(state.seed)
        ? rumsdk.utils.restoreSeedFromUrl(state.seed)
        : JSON.parse(state.seed);
    } catch (e) {
      snackbarStore.show({
        message: lang.seedParsingError,
        type: 'error',
      });
      return;
    }

    await runLoading(
      (l) => { state.loading = l; },
      async () => {
        try {
          if (!state.privateKey.disabledReason && state.privateKey.privateKey) {
            await createNewKey();
          }
          await joinGroupProcess(state.seed);
          runInAction(() => {
            state.done = true;
          });
          handleClose();
        } catch (err: any) {
          console.error(err);
          if (err.message.includes('existed')) {
            await sleep(400);
            runInAction(() => {
              state.done = true;
            });
            handleClose();
            if (activeGroupStore.id !== seedJson.group_id) {
              await sleep(400);
              if (!groupStore.hasGroup(seedJson.group_id)) {
                snackbarStore.show({
                  message: lang.existMember,
                  type: 'error',
                });
                return;
              }
              activeGroupStore.setSwitchLoading(true);
              activeGroupStore.setId(seedJson.group_id);
            }
            return;
          }
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    );
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  };

  const handleSelectFile = async () => {
    if (state.loading) { return; }
    runInAction(() => {
      state.loadingSeed = true;
    });

    let seed = '';

    try {
      const file = await ipcRenderer.invoke('open-dialog', {
        filters: [{ name: 'json', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (!file.canceled && file.filePaths) {
        seed = await fs.readFile(
          file.filePaths[0].toString(),
          'utf8',
        );
      }
    } catch (err) {
      console.error(err);
    }
    runInAction(() => {
      state.seed = seed;
      state.loadingSeed = false;
    });
  };

  const handleConfirmPrivateKey = async () => {
    await runLoading(
      (l) => { state.privateKey.loading = l; },
      async () => {
        if (state.privateKey.mode === 'keystore') {
          try {
            const wallet = await rumsdk.ethers.Wallet.fromEncryptedJson(state.privateKey.keystore, state.privateKey.password);
            runInAction(() => {
              state.privateKey.privateKey = wallet.privateKey;
              state.privateKey.address = wallet.address;
              state.privateKey.open = false;
            });
          } catch (e) {
            snackbarStore.show({
              message: '解密 keystore 错误',
              type: 'error',
            });
          }
        }
        if (state.privateKey.mode === 'privateKey') {
          try {
            const wallet = new rumsdk.ethers.Wallet(state.privateKey.privateKey);
            runInAction(() => {
              state.privateKey.address = wallet.address;
              state.privateKey.open = false;
            });
          } catch (e) {
            snackbarStore.show({
              message: '解密 privateKey 错误',
              type: 'error',
            });
          }
        }
      },
    );
  };

  const createNewKey = async () => {
    if (nodeStore.mode !== 'INTERNAL') {
      throw new Error('create new key while not internal node');
    }
    try {
      const seed = rumsdk.utils.restoreSeedFromUrl(state.seed);
      const groupId = seed.group_id;
      const signKeyPath = join(nodeStore.storagePath, 'keystore', `sign_${groupId}`);
      const encryptKeyPath = join(nodeStore.storagePath, 'keystore', `encrypt_${groupId}`);
      const peerConfigPath = join(nodeStore.storagePath, 'peerConfig', 'peer_options.toml');
      const signKeyExisted = await checkFileExisted(signKeyPath);
      const encryptKeyExisted = await checkFileExisted(encryptKeyPath);
      if (signKeyExisted || encryptKeyExisted) {
        return;
      }
      const peerConfigBuffer = await readFile(peerConfigPath);

      const wallet = new rumsdk.ethers.Wallet(state.privateKey.privateKey);
      const keystore = await wallet.encrypt(nodeStore.password, { scrypt: { N: 2 ** 12 } });
      const ageKey = await rumsdk.utils.ageEncryption.keygen();
      const agePrivateKey = ageKey[0];
      const agePrivateKeyBuffer = Buffer.from(agePrivateKey);
      const encryptedAgeKey = await rumsdk.utils.ageEncryption.encrypt_with_user_passphrase(nodeStore.password, agePrivateKeyBuffer, true);
      const keyBase64 = Buffer.from(encryptedAgeKey)
        .toString()
        .replace(/-+BEGIN AGE ENCRYPTED FILE-+/, '')
        .replace(/-+END AGE ENCRYPTED FILE-+/, '')
        .trim();
      const keyBuffer = Buffer.from(keyBase64, 'base64');
      const peerConfig: any = TOML.parse(peerConfigBuffer.toString());
      peerConfig.signkeymap[groupId] = wallet.address.toLowerCase();
      const newPeerConfig = TOML.stringify(peerConfig);
      await writeFile(peerConfigPath, newPeerConfig);
      await writeFile(signKeyPath, keystore);
      await writeFile(encryptKeyPath, keyBuffer);
    } catch (e) {
      console.error(e);
    }
  };

  const checkKeyExisted = async () => {
    runInAction(() => {
      state.privateKey.disabledReason = 'loading';
    });
    try {
      const seed = rumsdk.utils.restoreSeedFromUrl(state.seed);
      const groupId = seed.group_id;
      const signKeyPath = join(nodeStore.storagePath, 'keystore', `sign_${groupId}`);
      const encryptKeyPath = join(nodeStore.storagePath, 'keystore', `encrypt_${groupId}`);
      const signKeyExisted = await checkFileExisted(signKeyPath);
      const encryptKeyExisted = await checkFileExisted(encryptKeyPath);
      if (signKeyExisted || encryptKeyExisted) {
        runInAction(() => {
          state.privateKey.disabledReason = 'keyexisted';
        });
        return;
      }
      runInAction(() => {
        state.privateKey.disabledReason = '';
      });
    } catch (e) {
      runInAction(() => {
        state.privateKey.disabledReason = 'unknown';
      });
    }
  };

  useEffect(() => {
    if (nodeStore.mode !== 'INTERNAL') {
      runInAction(() => { state.privateKey.disabledReason = 'notinternal'; });
      return;
    }
    checkKeyExisted();
  }, [state.seed]);

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  return (<>
    <Dialog
      open={state.open}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 text-center p-8 pb-4">
        <div className="w-72">
          <div className="text-18 font-bold text-gray-700">{lang.joinGroup}</div>
          <TextField
            className="w-full text-12 px-4 pt-5"
            placeholder={lang.pasteSeedText}
            size="small"
            multiline
            minRows={6}
            maxRows={6}
            value={state.seed}
            autoFocus
            onChange={action((e) => { state.seed = e.target.value.trim(); })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />

          <div className="text-12 mt-2 flex items-center justify-center text-gray-400">
            <div>{lang.or}</div>
            <Tooltip
              disableHoverListener={!!state.seed}
              placement="top"
              title={lang.selectSeedToJoin}
              arrow
              disableInteractive
            >
              <div className="flex items-center cursor-pointer font-bold text-gray-500 opacity-90" onClick={handleSelectFile}>
                {lang.selectSeedFile}
                <GoChevronRight className="text-12 opacity-80" />
              </div>
            </Tooltip>
          </div>

          {false && (
            <Tooltip title={state.disabledReason}>
              <div className="flex flex-center mt-2">
                <MuiButton
                  className="flex flex-center cursor-pointer font-bold text-12 text-gray-500 opacity-90 px-2"
                  onClick={action(() => { state.privateKey.open = true; })}
                  variant="text"
                  size="small"
                  disabled={!!state.privateKey.disabledReason}
                >
                  {!state.privateKey.address && '手动输入私钥'}
                  {!!state.privateKey.address && '使用 '}
                  {state.privateKey.address.slice(0, 11)}
                  {!state.privateKey.address && <GoChevronRight className="text-12 opacity-80" />}
                </MuiButton>
                {!!state.privateKey.address && (
                  <IconButton
                    className="flex flex-center cursor-pointer font-bold text-12 text-gray-500 opacity-90"
                    onClick={action(() => { state.privateKey.privateKey = ''; state.privateKey.address = ''; })}
                    disabled={!!state.privateKey.disabledReason}
                  >
                    <MdDelete className="text-16 opacity-80" />
                  </IconButton>
                )}
              </div>
            </Tooltip>
          )}

          <div className="mt-4 pt-[2px]">
            <Button
              fullWidth
              isDoing={state.loading}
              isDone={state.done}
              disabled={!state.seed}
              onClick={submit}
            >
              {lang.yes}
            </Button>
            <div
              className="mt-2 pt-[2px] text-gray-500 hover:text-black text-12 cursor-pointer text-center opacity-70"
              onClick={() => {
                shell.openExternal('https://docs.prsdev.club/#/rum-app/');
              }}
            >
              {lang.availablePublicGroups}
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      open={state.privateKey.open}
      onClose={action(() => { state.privateKey.open = false; })}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 text-center p-8">
        <div className="w-72">
          <div className="text-18 font-bold text-gray-700">
            手动输入私钥
          </div>
          <FormControl className="mt-3">
            <RadioGroup
              className="flex flex-row"
              value={state.privateKey.mode}
              onChange={action((_, v) => { state.privateKey.mode = v as any; })}
            >
              <FormControlLabel classes={{ label: 'text-14' }} value="keystore" control={<Radio size="small" />} label="Keystore" />
              <FormControlLabel classes={{ label: 'text-14' }} value="privateKey" control={<Radio size="small" />} label="私钥" />
            </RadioGroup>
          </FormControl>
          {state.privateKey.mode === 'privateKey' && (
            <TextField
              className="w-full text-12 px-4 pt-3"
              placeholder="输入 eth key"
              size="small"
              multiline
              minRows={6}
              maxRows={6}
              value={state.privateKey.privateKey}
              autoFocus
              onChange={action((e) => { state.privateKey.privateKey = e.target.value; })}
              margin="dense"
              variant="outlined"
            />
          )}
          {state.privateKey.mode === 'keystore' && (<>
            <TextField
              className="w-full text-12 px-4 pt-3"
              placeholder="输入 keystore"
              size="small"
              multiline
              minRows={6}
              maxRows={6}
              value={state.privateKey.keystore}
              autoFocus
              onChange={action((e) => { state.privateKey.keystore = e.target.value; })}
              margin="dense"
              variant="outlined"
            />
            <TextField
              className="w-full text-12 px-4"
              placeholder="输入密码"
              size="small"
              value={state.privateKey.password}
              autoFocus
              onChange={action((e) => { state.privateKey.password = e.target.value; })}
              margin="dense"
              variant="outlined"
            />
          </>)}

          <div className="mt-4 pt-[2px]">
            <Button fullWidth onClick={handleConfirmPrivateKey} disabled={state.privateKey.loading}>
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </>);
});

const checkFileExisted = async (path: string) => {
  try {
    const res = await stat(path);
    return true;
  } catch (e) {
    return false;
  }
};

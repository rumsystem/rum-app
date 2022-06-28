import path from 'path';
import React from 'react';
import classNames from 'classnames';
import { render, unmountComponentAtNode } from 'react-dom';
import { format } from 'date-fns';
import fs from 'fs-extra';
import { dialog, getCurrentWindow } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, observable, runInAction } from 'mobx';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, Dialog as MuiDialog, CircularProgress } from '@material-ui/core';
import { MdDone } from 'react-icons/md';
import PasswordInput from 'components/PasswordInput';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import formatPath from 'utils/formatPath';
import * as Quorum from 'utils/quorum';
import { qwasm } from 'utils/quorum-wasm/load-quorum';
import { useJoinGroup } from 'hooks/useJoinGroup';

export const importKeyData = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <ImportKeyData
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface Props {
  rs: () => unknown
}

enum STEP {
  SELECT_MODE = 1,
  SELECT_BACKUP = 2,
  SELECT_FOLDER = 3,
  INPUT_PASSWORD = 4,
}

const ImportKeyData = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    mode: process.env.IS_ELECTRON ? 'native' : 'wasm',
    step: STEP.SELECT_MODE,
    open: true,
    loading: false,
    done: false,
    loadingKeyData: false,
    backupPath: null as any,
    backupFileContent: '',
    password: '',
    storagePath: '',
  }));
  const {
    snackbarStore,
  } = useStore();

  const submit = async () => {
    if (state.loading) { return; }
    if (state.step === STEP.SELECT_BACKUP && !process.env.IS_ELECTRON) {
      runInAction(() => { state.step = STEP.INPUT_PASSWORD; });
      return;
    }
    if (state.step < STEP.INPUT_PASSWORD) {
      runInAction(() => { state.step += 1; });
      return;
    }
    if (state.step === STEP.INPUT_PASSWORD) {
      runInAction(() => {
        state.loading = true;
        state.done = false;
      });
      try {
        if (process.env.IS_ELECTRON) {
          const { error } = state.mode === 'native'
            ? await Quorum.importKey({
              backupPath: state.backupPath,
              storagePath: state.storagePath,
              password: state.password,
            })
            : await Quorum.importKeyWasm({
              backupPath: state.backupPath,
              storagePath: state.storagePath,
              password: state.password,
            });
          if (!error) {
            runInAction(() => {
              state.done = true;
            });
            snackbarStore.show({
              message: lang.importKeyDataDone,
            });
            handleClose();
            return;
          }
          if (error.includes('Failed to read backup file')) {
            snackbarStore.show({
              message: lang.failedToReadBackipFile,
              type: 'error',
            });
            return;
          }
          if (error.includes('not a valid zip file')) {
            snackbarStore.show({
              message: lang.notAValidZipFile,
              type: 'error',
            });
            return;
          }
          if (error.includes('is not empty')) {
            snackbarStore.show({
              message: lang.isNotEmpty,
              type: 'error',
            });
            return;
          }
          if (error.includes('incorrect passphrase')) {
            snackbarStore.show({
              message: lang.incorrectPassword,
              type: 'error',
            });
            return;
          }
          if (error.includes('permission denied')) {
            snackbarStore.show({
              message: lang.writePermissionDenied,
              type: 'error',
            });
            return;
          }
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        } else {
          await qwasm.RestoreWasmRaw(state.password, state.backupFileContent);
          snackbarStore.show({
            message: lang.importKeyDataDone,
          });
          handleClose();
          try {
            const backup = JSON.parse(state.backupFileContent);
            runInAction(() => {
              wasmImportService.state.seeds = (backup.seeds as Array<any>).map((v) => ({
                done: false,
                seed: v,
              }));
            });
          } catch (e) {}
          wasmImportService.emit('import-done');
        }
      } catch (err: any) {
        console.error(err);
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      } finally {
        runInAction(() => {
          state.loading = false;
        });
      }
    }
  };

  const handleSelectBackup = async () => {
    runInAction(() => {
      state.loadingKeyData = true;
    });
    try {
      if (process.env.IS_ELECTRON) {
        const file = state.mode === 'native'
          ? await dialog.showOpenDialog(getCurrentWindow(), {
            filters: [{ name: 'enc', extensions: ['enc'] }],
            properties: ['openFile'],
          })
          : await dialog.showOpenDialog(getCurrentWindow(), {
            filters: [{ name: 'backup.json', extensions: ['json'] }],
            properties: ['openFile'],
          });
        if (!file.canceled && file.filePaths) {
          runInAction(() => {
            state.backupPath = file.filePaths[0].toString();
          });
        }
      } else {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'json file',
            accept: { 'text/json': ['.json'] },
          }],
        }).catch(() => [null]);
        if (!handle) { return; }
        const file = await handle.getFile();
        const content: string = await file.text();
        runInAction(() => {
          state.backupFileContent = content;
        });
      }
    } catch (err) {
      console.error(err);
    }
    runInAction(() => {
      state.loadingKeyData = false;
    });
  };

  const handleSelectDir = async () => {
    // TODO:
    if (!process.env.IS_ELECTRON) {
      return;
    }

    const isRumFolder = (p: string) => {
      const folderName = path.basename(p);
      return /^rum(-.+)?$/.test(folderName);
    };
    const isEmptyFolder = async (p: string) => {
      const exist = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const files = await (async () => {
        try {
          const f = await fs.readdir(p);
          return { right: f };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const notExist = !!exist.left && exist.left.code === 'ENOENT';
      const isEmpty = !!files.right && !files.right.length;
      return notExist || isEmpty;
    };

    const selectePath = async () => {
      const file = await dialog.showOpenDialog(getCurrentWindow(), {
        properties: ['openDirectory'],
      });
      const p = file.filePaths[0];
      if (file.canceled || !file.filePaths.length || state.storagePath === p) {
        return null;
      }
      return p;
    };

    const selectedPath = await selectePath();
    if (!selectedPath) {
      return;
    }

    const date = format(new Date(), 'yyyyMMdd');
    const paths = [
      selectedPath,
      path.join(selectedPath, 'rum'),
      path.join(selectedPath, `rum-${date}`),
    ];

    for (const p of paths) {
      if (isRumFolder(p) && await isEmptyFolder(p)) {
        runInAction(() => {
          state.storagePath = p;
        });
        return;
      }
    }

    const files = await fs.readdir(selectedPath);
    // find the max index in `rum-${date}-${index}`
    const maxIndex = files
      .map((v) => new RegExp(`rum-${date}-(\\d+?)$`).exec(v))
      .filter(<T extends unknown>(v: T | null): v is T => !!v)
      .map((v) => Number(v[1]))
      .reduce((p, c) => Math.max(p, c), 0);
    const newPath = path.join(selectedPath, `rum-${date}-${maxIndex + 1}`);
    await fs.mkdirp(newPath);
    runInAction(() => {
      state.storagePath = newPath;
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const selectedBackupFile = !!state.backupPath || !!state.backupFileContent;

  return (
    <Dialog
      disableEscapeKeyDown
      open={state.open}
      transitionDuration={{
        enter: 300,
      }}
      onClose={(...args) => {
        if (state.loading || args[1] === 'backdropClick') {
          return;
        }
        handleClose();
      }}
    >
      <div className="w-100 bg-white rounded-12 text-center px-8 pt-12 pb-8">
        <div>
          {state.step === STEP.SELECT_MODE && (<>
            <div className="text-16 font-bold text-gray-4a">选择导入类型</div>
            <div className="mt-4">
              <FormControl>
                <RadioGroup
                  defaultValue="native"
                  value={state.mode}
                  onChange={action((_, v) => { state.mode = v as any; })}
                >
                  <FormControlLabel
                    className="select-none"
                    disabled={!process.env.IS_ELECTRON}
                    value="native"
                    control={<Radio />}
                    label="导入给 rum-app 的备份"
                  />
                  <FormControlLabel
                    className="select-none"
                    value="wasm"
                    control={<Radio />}
                    label="导入给浏览器的备份"
                  />
                </RadioGroup>
              </FormControl>

              <Button
                className="rounded min-w-[160px] h-10 mt-4"
                size="x-large"
                onClick={submit}
              >
                下一步
              </Button>
            </div>
          </>)}
          {state.step === STEP.SELECT_BACKUP && (<>
            <div className="text-16 font-bold text-gray-4a">{lang.importKey}</div>
            <Tooltip
              disableHoverListener={selectedBackupFile}
              placement="top"
              title={lang.selectKeyBackupToImport}
              arrow
            >
              <div className="mt-6">
                <Button
                  className="rounded min-w-[160px] h-10"
                  size="x-large"
                  color={selectedBackupFile ? 'green' : 'primary'}
                  isDoing={state.loadingKeyData}
                  onClick={handleSelectBackup}
                >
                  {selectedBackupFile ? lang.selectedKeyBackupFile : lang.selectKeyBackupFile}
                  {selectedBackupFile && <MdDone className="ml-1 text-15" />}
                </Button>
              </div>
            </Tooltip>
            <div className="mt-6">
              <Button
                className="rounded min-w-[160px] h-10"
                size="x-large"
                disabled={!selectedBackupFile}
                onClick={submit}
              >
                {lang.yes}
              </Button>
            </div>
          </>)}
          {state.step === STEP.SELECT_FOLDER && (<>
            <div className="text-16 font-bold text-gray-4a">{ lang.selectFolder }</div>
            <div className="mt-6 text-gray-9b tracking-wide leading-loose">
              { lang.storagePathTip2 }
            </div>
            <div className="mt-6 mb-4 pt-[2px]">
              {!state.storagePath && (
                <Button
                  className="rounded min-w-[160px] h-10"
                  size="x-large"
                  onClick={handleSelectDir}
                >
                  {lang.selectFolder}
                </Button>
              )}

              {state.storagePath && (<>
                <div className="flex">
                  <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 border-r-0">
                    <Tooltip placement="top" title={state.storagePath} arrow interactive>
                      <div className="tracking-wide">
                        {formatPath(state.storagePath, { truncateLength: 19 })}
                      </div>
                    </Tooltip>
                  </div>
                  <Button
                    className="rounded-r-12 opacity-60"
                    size="small"
                    onClick={handleSelectDir}
                  >
                    {lang.edit}
                  </Button>
                </div>
                <div className="mt-6">
                  <Button
                    className="rounded min-w-[160px] h-10"
                    size="x-large"
                    isDoing={state.loading}
                    isDone={state.done}
                    onClick={submit}
                  >
                    {lang.yes}
                  </Button>
                </div>
              </>)}
            </div>
          </>)}
          {state.step === STEP.INPUT_PASSWORD && (<>
            <div className="text-16 font-bold text-gray-4a">{ lang.enterPassword }</div>
            <div className="mt-6">
              <PasswordInput
                className="w-full"
                placeholder={lang.password}
                size="small"
                value={state.password}
                onChange={action((e) => { state.password = e.target.value; })}
                onKeyDown={handleInputKeyDown}
                margin="dense"
                variant="outlined"
                type="password"
              />
            </div>
            <div className="mt-6 mb-4 pt-[2px]">
              <Button
                className="rounded min-w-[160px] h-10"
                size="x-large"
                disabled={!state.password}
                isDoing={state.loading}
                isDone={state.done}
                onClick={submit}
              >
                {lang.yes}
              </Button>
            </div>
          </>)}
          {state.step > 1 && (
            <div className="my-4">
              <span
                className={classNames(
                  'mt-5 text-link-blue text-14',
                  state.loading ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
                onClick={() => {
                  if (state.loading) {
                    return;
                  }
                  runInAction(() => {
                    state.step = state.step > 1 ? state.step - 1 : 1;
                  });
                }}
              >
                {lang.backOneStep}
              </span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
});

export interface BackupFile {
  keystore: Array<string>
  seeds: Array<{
    genesis_block: {
      BlockId: string
      GroupId: string
      ProducerPubKey: string
      Hash: string
      Signature: string
      TimeStamp: string
    }
    group_id: string
    group_name: string
    owner_pubkey: string
    consensus_type: string
    encryption_type: string
    cipher_key: string
    app_key: string
    signature: string
  }>
}

type WasmImportEvents = 'import-done';

export const wasmImportService = {
  listeners: new Map<string, Array<() => unknown>>(),
  state: observable({
    seeds: null as null | Array<{ done: boolean, seed: BackupFile['seeds'][number] }>,
  }),
  restoreSeeds: async (joinGroup: ReturnType<typeof useJoinGroup>) => {
    if (wasmImportService.state.seeds) {
      for (const item of wasmImportService.state.seeds) {
        try {
          await new Promise<void>((rs) => joinGroup(item.seed, rs, true));
        } catch (e) {
          console.error(e);
        }
        runInAction(() => { item.done = true; });
      }
      wasmImportService.state.seeds = null;
    }
  },
  on: (e: WasmImportEvents, cb: () => unknown) => {
    const arr = wasmImportService.listeners.get(e) || [];
    wasmImportService.listeners.set(e, arr);
    arr.push(cb);
    return () => {
      const index = arr.indexOf(cb);
      if (index !== -1) {
        arr.splice(index, 1);
      }
    };
  },
  emit: (e: WasmImportEvents) => {
    const arr = wasmImportService.listeners.get(e) || [];
    arr.forEach((v) => v());
  },
};

export const ImportSeedDialog = observer(() => (
  <MuiDialog
    open={!!wasmImportService.state.seeds}
  >
    <div className="py-8 px-12 text-16">
      <div className="flex flex-center">
        <CircularProgress className="text-gray-af" size={32} />
      </div>
      <div className="mt-4">
        正在恢复种子网络 ({(wasmImportService.state.seeds?.filter((v) => v.done).length ?? 0) + 1} / {wasmImportService.state.seeds?.length})
      </div>
    </div>
  </MuiDialog>
));

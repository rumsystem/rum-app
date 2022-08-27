import path from 'path';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import fs from 'fs-extra';
import { dialog, getCurrentWindow } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { Tooltip } from '@material-ui/core';
import { MdDone } from 'react-icons/md';
import PasswordInput from 'components/PasswordInput';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { format } from 'date-fns';
import formatPath from 'utils/formatPath';
import * as Quorum from 'utils/quorum';

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

const ImportKeyData = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    step: 1,
    open: true,
    loading: false,
    done: false,
    loadingKeyData: false,
    backupPath: null as any,
    password: '',
    storagePath: '',
  }));
  const {
    snackbarStore,
  } = useStore();

  const submit = async () => {
    if (state.loading) {
      return;
    }
    if (state.step === 1) {
      runInAction(() => {
        state.step = 2;
      });
      return;
    }
    if (state.step === 2) {
      runInAction(() => {
        state.step = 3;
      });
      return;
    }
    if (state.step === 3) {
      runInAction(() => {
        state.loading = true;
        state.done = false;
      });
      try {
        const { error } = await Quorum.importKey({
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

  return (
    <Dialog
      disableEscapeKeyDown
      hideCloseButton
      open={state.open}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 text-center p-8 pb-4">
        <div className="w-64">
          {
            state.step === 1 && (
              <>
                <div className="text-18 font-bold text-gray-700">{lang.importKey}</div>
                <div className="mt-4 pt-2" />
                <Tooltip
                  disableHoverListener={!!state.backupPath}
                  placement="top"
                  title={lang.selectKeyBackupToImport}
                  arrow
                >
                  <div className="px-8 py-2 mt-1">
                    <Button
                      fullWidth
                      color={state.backupPath ? 'green' : 'primary'}
                      isDoing={state.loadingKeyData}
                      onClick={async () => {
                        runInAction(() => {
                          state.loadingKeyData = true;
                        });
                        try {
                          const file = await dialog.showOpenDialog(getCurrentWindow(), {
                            filters: [{ name: 'enc', extensions: ['enc'] }],
                            properties: ['openFile'],
                          });
                          if (!file.canceled && file.filePaths) {
                            runInAction(() => {
                              state.backupPath = file.filePaths[0].toString();
                            });
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        runInAction(() => {
                          state.loadingKeyData = false;
                        });
                      }}
                    >
                      {state.backupPath ? lang.selectedKeyBackupFile : lang.selectKeyBackupFile}
                      {state.backupPath && <MdDone className="ml-1 text-15" />}
                    </Button>
                  </div>
                </Tooltip>
                <div className="mt-6 mb-4 pt-[2px]">
                  <Button
                    fullWidth
                    disabled={!state.backupPath}
                    onClick={submit}
                  >
                    {lang.yes}
                  </Button>
                </div>
              </>
            )
          }
          {
            state.step === 2 && (
              <>
                <div className="text-18 font-bold text-gray-700">{ lang.selectFolder }</div>
                <div className="mt-4 pt-2" />
                <div className="mt-1 text-gray-9b tracking-wide leading-loose">
                  {lang.storagePathTip1}
                  <br />
                  {lang.storagePathTip2}
                  <br />
                  {lang.storagePathTip3}
                  <br />
                  {lang.storagePathTip4}
                </div>
                <div className="mt-6 mb-4 pt-[2px]">
                  {!state.storagePath && (
                    <Button fullWidth onClick={handleSelectDir}>
                      {lang.selectFolder}
                    </Button>
                  )}

                  {state.storagePath && (
                    <>
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
                      <div className="mt-8">
                        <Button
                          fullWidth
                          isDoing={state.loading}
                          isDone={state.done}
                          onClick={submit}
                        >
                          {lang.yes}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          }
          {
            state.step === 3 && (
              <>
                <div className="text-18 font-bold text-gray-700">{ lang.enterPassword }</div>
                <div className="mt-4 pt-2" />
                <div className="mt-1">
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
                    fullWidth
                    disabled={!state.password}
                    isDoing={state.loading}
                    isDone={state.done}
                    onClick={submit}
                  >
                    {lang.yes}
                  </Button>
                </div>
              </>
            )
          }
          {
            state.step > 1 && (
              <div className="-mt-1 mb-4">
                <Button
                  fullWidth
                  disabled={state.loading}
                  onClick={() => {
                    runInAction(() => {
                      state.step = state.step > 1 ? state.step - 1 : 1;
                    });
                  }}
                >
                  {lang.backOneStep}
                </Button>
              </div>
            )
          }
          <div className="-mt-1 mb-1">
            <Button
              fullWidth
              disabled={state.loading}
              onClick={handleClose}
            >
              {lang.quit}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});

import path from 'path';
import React from 'react';
import { ipcRenderer } from 'electron';
import { render, unmountComponentAtNode } from 'react-dom';
import fs from 'fs-extra';
import { dialog, getCurrentWindow } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { Tooltip } from '@material-ui/core';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { format } from 'date-fns';
import formatPath from 'utils/formatPath';
import * as Quorum from 'utils/quorum';
import PasswordInput from 'components/PasswordInput';

import useCloseNode from 'hooks/useCloseNode';
import useResetNode from 'hooks/useResetNode';

import sleep from 'utils/sleep';

export const exportKeyData = async () => new Promise<void>((rs) => {
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
          <ExportKeyData
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

const ExportKeyData = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    step: 1,
    open: true,
    loading: false,
    done: false,
    backupPath: null as any,
    password: '',
    storagePath: '',
  }));
  const {
    snackbarStore,
    nodeStore,
    confirmDialogStore,
  } = useStore();

  const closeNode = useCloseNode();
  const resetNode = useResetNode();

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
        const { error } = await Quorum.exportKey({
          backupPath: state.backupPath,
          storagePath: state.storagePath,
          password: state.password,
        });
        if (!error) {
          runInAction(() => {
            state.done = true;
          });
          snackbarStore.show({
            message: lang.exportKeyDataDone,
          });
          handleClose();
          return;
        }
        if (error.includes('could not decrypt key with given password')) {
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

  const handleSelectRumDir = async () => {
    const isRumDataFolder = async (p: string) => {
      const stat = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();

      if (stat.left || !stat.right.isDirectory()) {
        return false;
      }
      const files = await fs.readdir(p);
      return files.some((v) => v === 'peerConfig');
    };
    const includeKeystoreFolder = async (p: string) => {
      const files = await fs.readdir(p);
      return files.some((v) => v === 'keystore');
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

    const paths = [
      selectedPath,
      path.join(selectedPath, 'rum'),
    ];

    let noKeystoreFolder = false;

    for (const p of paths) {
      if (await isRumDataFolder(p)) {
        if (await includeKeystoreFolder(p)) {
          if (nodeStore.storagePath === p) {
            confirmDialogStore.show({
              content: lang.exportCurrentNodeNeedToQuit,
              okText: lang.yes,
              isDangerous: true,
              ok: async () => {
                if (!process.env.IS_ELECTRON) {
                  return;
                }
                ipcRenderer.send('disable-app-quit-prompt');
                confirmDialogStore.setLoading(true);
                await sleep(800);
                confirmDialogStore.hide();
                handleClose();
                if (nodeStore.mode === 'INTERNAL') {
                  await closeNode();
                }
                resetNode();
                await sleep(300);
                window.location.reload();
              },
            });
          } else {
            runInAction(() => {
              state.storagePath = p;
            });
          }
          return;
        }
        noKeystoreFolder = true;
      }
    }

    snackbarStore.show({
      message: noKeystoreFolder ? lang.keyStoreNotExist : lang.nodeDataNotExist,
      type: 'error',
      duration: 4000,
    });
  };

  const handleSelectDir = async () => {
    // TODO:
    if (!process.env.IS_ELECTRON) {
      return;
    }

    const isNotExistFolder = async (p: string) => {
      const exist = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const notExist = !!exist.left && exist.left.code === 'ENOENT';
      return notExist;
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
      path.join(selectedPath, 'rum-backup'),
      path.join(selectedPath, `rum-backup-${date}`),
    ];

    for (const p of paths) {
      if (await isNotExistFolder(p)) {
        runInAction(() => {
          state.backupPath = p;
        });
        return;
      }
    }

    const files = await fs.readdir(selectedPath);
    // find the max index in `rum-${date}-${index}`
    const maxIndex = files
      .map((v) => new RegExp(`rum-backup-${date}-(\\d+?)$`).exec(v))
      .filter(<T extends unknown>(v: T | null): v is T => !!v)
      .map((v) => Number(v[1]))
      .reduce((p, c) => Math.max(p, c), 0);
    const newPath = path.join(selectedPath, `rum-backup-${date}-${maxIndex + 1}`);
    runInAction(() => {
      state.backupPath = newPath;
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
                <div className="text-18 font-bold text-gray-700">{ lang.selectFolder }</div>
                <div className="mt-4 pt-2" />
                <div className="mt-1 text-gray-9b tracking-wide leading-loose">
                  <div dangerouslySetInnerHTML={{ __html: lang.storagePathLoginTip }} />
                </div>
                <div className="mt-6 mb-4 pt-[2px]">
                  {!state.storagePath && (
                    <Button fullWidth onClick={handleSelectRumDir}>
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
                          onClick={handleSelectRumDir}
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
            state.step === 2 && (
              <>
                <div className="text-18 font-bold text-gray-700">{ lang.selectFolder }</div>
                <div className="mt-4 pt-2" />
                <div className="mt-1 text-gray-9b tracking-wide leading-loose">
                  {lang.selectFolderToSaveKeyBackupFile}
                </div>
                <div className="mt-6 mb-4 pt-[2px]">
                  {!state.backupPath && (
                    <Button fullWidth onClick={handleSelectDir}>
                      {lang.selectFolder}
                    </Button>
                  )}

                  {state.backupPath && (
                    <>
                      <div className="flex">
                        <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 border-r-0">
                          <Tooltip placement="top" title={state.backupPath} arrow interactive>
                            <div className="tracking-wide">
                              {formatPath(state.backupPath, { truncateLength: 19 })}
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

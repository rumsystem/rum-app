import path from 'path';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import fs from 'fs-extra';
import { dialog, getCurrentWindow } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { TextField, Tooltip } from '@material-ui/core';
import { MdDone } from 'react-icons/md';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { format } from 'date-fns';
import formatPath from 'utils/formatPath';

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
    step: 3,
    open: true,
    loading: false,
    done: false,
    loadingKeyData: false,
    seed: null as any,
    keyDataString: '',
    showTextInputModal: false,
    password: '',
    storagePath: '',
  }));
  const {
    snackbarStore,
    activeGroupStore,
    seedStore,
    nodeStore,
  } = useStore();
  const fetchGroups = useFetchGroups();

  const submit = async () => {
    if (state.loading) {
      return;
    }
    runInAction(() => {
      state.loading = true;
      state.done = false;
    });
    try {
      const seed = (state.showTextInputModal ? JSON.parse(state.keyDataString) : state.seed) as ICreateGroupsResult;
      await GroupApi.joinGroup(seed);
      await sleep(600);
      await seedStore.addSeed(
        nodeStore.storagePath,
        seed.group_id,
        seed,
      );
      await fetchGroups();
      await sleep(2000);
      runInAction(() => {
        state.done = true;
      });
      await sleep(300);
      activeGroupStore.setId(seed.group_id);
      await sleep(200);
      snackbarStore.show({
        message: lang.joined,
      });
      runInAction(() => {
        state.showTextInputModal = false;
      });
      handleClose();
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('existed')) {
        snackbarStore.show({
          message: lang.existMember,
          type: 'error',
        });
        return;
      }
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    } finally {
      runInAction(() => {
        state.loading = false;
      });
    }
  };

  const handleSelectDir = async () => {
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

  return (<>
    <Dialog
      open={state.open}
      onClose={handleClose}
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
                  disableHoverListener={!!state.seed}
                  placement="top"
                  title={lang.selectKeyBackupToImport}
                  arrow
                >
                  <div className="px-8 py-2 mt-1">
                    <Button
                      fullWidth
                      color={state.seed ? 'green' : 'primary'}
                      isDoing={state.loadingKeyData}
                      onClick={async () => {
                        runInAction(() => {
                          state.loadingKeyData = true;
                        });
                        try {
                          const file = await dialog.showOpenDialog(getCurrentWindow(), {
                            filters: [{ name: 'json', extensions: ['json'] }],
                            properties: ['openFile'],
                          });
                          if (!file.canceled && file.filePaths) {
                            const keyDataString = await fs.readFile(
                              file.filePaths[0].toString(),
                              'utf8',
                            );
                            await sleep(500);
                            runInAction(() => {
                              state.seed = JSON.parse(keyDataString);
                            });
                            seedStore.addSeed(
                              nodeStore.storagePath,
                              state.seed.GroupId,
                              state.seed,
                            );
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        runInAction(() => {
                          state.loadingKeyData = false;
                        });
                      }}
                    >
                      {state.seed ? lang.selectedKeyBackupFile : lang.selectKeyBackupFile}
                      {state.seed && <MdDone className="ml-1 text-15" />}
                    </Button>
                  </div>
                </Tooltip>
                <div className="mt-1 text-12 text-gray-500 flex items-center justify-center pb-1">
                  {lang.or}
                  <div
                    className="flex items-center text-gray-700 font-bold cursor-pointer ml-1 hover:text-black"
                    onClick={action(() => { state.showTextInputModal = true; })}
                  >
                    {lang.paste} <GoChevronRight className="text-12 opacity-80" />
                  </div>
                </div>
                <div className="mt-6 mb-4 pt-[2px]">
                  <Button
                    fullWidth
                    isDoing={state.loading}
                    isDone={state.done}
                    disabled={!state.seed}
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
                <div className="text-18 font-bold text-gray-700">{ lang.enterPassword }</div>
                <div className="mt-4 pt-2" />
                <div className="mt-1">
                  <TextField
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
                    isDoing={state.loading}
                    isDone={state.done}
                    disabled={!state.seed}
                    onClick={submit}
                  >
                    {lang.yes}
                  </Button>
                </div>
              </>
            )
          }
          {
            state.step === 3 && (
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
                          // onClick={() => props.onSelectPath(state.storagePath)}
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
        </div>
      </div>
    </Dialog>

    <Dialog
      open={state.showTextInputModal}
      onClose={action(() => {
        state.showTextInputModal = false;
        state.keyDataString = '';
      })}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 text-center p-8 pb-7">
        <div className="w-74">
          <div className="text-18 font-bold text-gray-700">{lang.importKey}</div>
          <div className="px-2 mt-3">
            <TextField
              className="w-full"
              placeholder={lang.pasteKeyBackupText}
              size="small"
              multiline
              minRows={6}
              maxRows={6}
              value={state.keyDataString}
              autoFocus
              onChange={action((e) => { state.keyDataString = e.target.value.trim(); })}
              onKeyDown={handleInputKeyDown}
              margin="dense"
              variant="outlined"
            />
          </div>
          <div className="mt-6">
            <Button
              fullWidth
              isDoing={state.loading}
              isDone={state.done}
              disabled={!state.keyDataString}
              onClick={submit}
            >
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </>);
});

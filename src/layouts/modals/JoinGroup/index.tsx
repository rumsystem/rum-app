import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Tooltip from '@material-ui/core/Tooltip';
import Button from 'components/Button';
import { MdDone } from 'react-icons/md';
import { shell } from 'electron';
import { dialog, getCurrentWindow } from '@electron/remote';
import fs from 'fs-extra';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import { GoChevronRight } from 'react-icons/go';
import { TextField } from '@material-ui/core';
import useFetchGroups from 'hooks/useFetchGroups';
import { action, reaction, runInAction } from 'mobx';

export const JoinGroup = observer(() => {
  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    loadingSeed: false,
    seed: null as any,
    seedString: '',
    showTextInputModal: false,
  }));
  const {
    snackbarStore,
    activeGroupStore,
    seedStore,
    nodeStore,
    modalStore,
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
      const seed = (state.showTextInputModal ? JSON.parse(state.seedString) : state.seed) as ICreateGroupsResult;
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
      modalStore.joinGroup.close();
      await sleep(200);
      snackbarStore.show({
        message: '已加入',
      });
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('existed')) {
        snackbarStore.show({
          message: '你已经是这个群组的成员',
          type: 'error',
        });
        return;
      }
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
    } finally {
      runInAction(() => {
        state.loading = false;
      });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  };

  React.useEffect(() => reaction(
    () => modalStore.joinGroup.show,
    action(() => {
      if (modalStore.joinGroup.show) {
        state.loading = false;
        state.done = false;
        state.loadingSeed = false;
        state.seed = null;
        state.seedString = '';
        state.showTextInputModal = false;
      }
    }),
  ), []);

  return (<>
    <Dialog
      open={modalStore.joinGroup.show}
      onClose={() => modalStore.joinGroup.close()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 text-center p-8 pb-4">
        <div className="w-64">
          <div className="text-18 font-bold text-gray-700">加入群组</div>
          <div className="mt-4 pt-2" />
          <Tooltip
            disableHoverListener={!!state.seed}
            placement="top"
            title="选择要加入群组的种子文件"
            arrow
          >
            <div className="px-8 py-2 mt-1">
              <Button
                fullWidth
                color={state.seed ? 'green' : 'primary'}
                isDoing={state.loadingSeed}
                onClick={async () => {
                  runInAction(() => {
                    state.loadingSeed = true;
                  });
                  try {
                    const file = await dialog.showOpenDialog(getCurrentWindow(), {
                      filters: [{ name: 'json', extensions: ['json'] }],
                      properties: ['openFile'],
                    });
                    if (!file.canceled && file.filePaths) {
                      const seedString = await fs.readFile(
                        file.filePaths[0].toString(),
                        'utf8',
                      );
                      await sleep(500);
                      runInAction(() => {
                        state.seed = JSON.parse(seedString);
                      });
                      seedStore.addSeed(
                        nodeStore.storagePath,
                        state.seed.group_id,
                        state.seed,
                      );
                    }
                  } catch (err) {
                    console.error(err);
                  }
                  runInAction(() => {
                    state.loadingSeed = false;
                  });
                }}
              >
                {state.seed ? '种子文件已选中' : '点击选择种子文件'}
                {state.seed && <MdDone className="ml-1 text-15" />}
              </Button>
            </div>
          </Tooltip>
          <div className="mt-1 text-12 text-gray-500 flex items-center justify-center pb-1">
            或者
            <div
              className="flex items-center text-gray-700 font-bold cursor-pointer ml-1 hover:text-black"
              onClick={action(() => { state.showTextInputModal = true; })}
            >
              粘贴文本 <GoChevronRight className="text-12 opacity-80" />
            </div>
          </div>
          <div className="mt-6 pt-[2px]">
            <Button
              fullWidth
              isDoing={state.loading}
              isDone={state.done}
              disabled={!state.seed}
              onClick={submit}
            >
              确定
            </Button>
            <div
              className="mt-2 pt-[2px] text-gray-500 hover:text-black text-12 cursor-pointer text-center opacity-70"
              onClick={() => {
                shell.openExternal('https://docs.prsdev.club/#/rum-app/');
              }}
            >
              有哪些公开的群组可以加入？
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      open={state.showTextInputModal}
      onClose={action(() => {
        state.showTextInputModal = false;
        state.seedString = '';
      })}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 text-center p-8 pb-7">
        <div className="w-74">
          <div className="text-18 font-bold text-gray-700">加入群组</div>
          <div className="px-2 mt-3">
            <TextField
              className="w-full"
              placeholder="粘贴种子文本"
              size="small"
              multiline
              minRows={6}
              maxRows={6}
              value={state.seedString}
              autoFocus
              onChange={action((e) => { state.seedString = e.target.value.trim(); })}
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
              disabled={!state.seedString}
              onClick={submit}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </>);
});
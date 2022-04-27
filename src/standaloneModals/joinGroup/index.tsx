import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import fs from 'fs-extra';
import { shell } from 'electron';
import { dialog, getCurrentWindow } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction, when } from 'mobx';
import { TextField, Tooltip } from '@material-ui/core';
import { MdDone } from 'react-icons/md';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import GroupApi, { GroupStatus, ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import useCheckGroupProfile from 'hooks/useCheckGroupProfile';
import { lang } from 'utils/lang';

export const joinGroup = async () => new Promise<void>((rs) => {
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
          <JoinGroup
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

const JoinGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
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
    groupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();
  const checkGroupProfile = useCheckGroupProfile();

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
      await sleep(200);
      snackbarStore.show({
        message: lang.joined,
      });
      trySetGlobalProfile(seed.group_id);
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

  const trySetGlobalProfile = async (groupId: string) => {
    await Promise.race([
      when(() => !!groupStore.map[groupId]),
      sleep(10000),
    ]);

    if (!groupStore.map[groupId]) {
      return;
    }

    await Promise.race([
      when(() => groupStore.map[groupId].group_status === GroupStatus.IDLE),
      when(() => !groupStore.map[groupId]),
      sleep(1000 * 60 * 3),
    ]);

    if (groupStore.map[groupId]?.group_status !== GroupStatus.IDLE) {
      return;
    }

    checkGroupProfile(groupId);
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
          <div className="text-18 font-bold text-gray-700">{lang.joinGroup}</div>
          <div className="mt-4 pt-2" />
          <Tooltip
            disableHoverListener={!!state.seed}
            placement="top"
            title={lang.selectSeedToJoin}
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
                        state.seed.GroupId,
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
                {state.seed ? lang.selectedSeedFile : lang.selectSeedFile}
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
          <div className="mt-6 pt-[2px]">
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
          <div className="text-18 font-bold text-gray-700">{lang.joinGroup}</div>
          <div className="px-2 mt-3">
            <TextField
              className="w-full"
              placeholder={lang.pasteSeedText}
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
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </>);
});

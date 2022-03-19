import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import fs from 'fs-extra';
import { dialog, getCurrentWindow, shell } from '@electron/remote';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { TextField, Tooltip } from '@material-ui/core';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { ICreateGroupsResult } from 'apis/group';
import { lang } from 'utils/lang';
import { useJoinGroup } from 'hooks/useJoinGroup';

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
    // seed: null as any,
    seedString: '',
  }));
  const {
    activeGroupStore,
    snackbarStore,
    groupStore,
  } = useStore();
  const joinGroupProcess = useJoinGroup();

  const submit = async () => {
    if (state.loading) {
      return;
    }

    let seed = {} as ICreateGroupsResult;
    try {
      seed = JSON.parse(state.seedString);
    } catch (e) {
      snackbarStore.show({
        message: lang.seedParsingError,
        type: 'error',
      });
      return;
    }

    runInAction(() => {
      state.loading = true;
      state.done = false;
    });

    try {
      await joinGroupProcess(seed);
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
        if (activeGroupStore.id !== seed.group_id) {
          await sleep(400);
          if (!groupStore.hasGroup(seed.group_id)) {
            snackbarStore.show({
              message: lang.existMember,
              type: 'error',
            });
            return;
          }
          activeGroupStore.setSwitchLoading(true);
          activeGroupStore.setId(seed.group_id);
        }
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  };

  const handleSelectFile = async () => {
    if (state.loading) {
      return;
    }
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
          state.seedString = seedString;
        });
      }
    } catch (err) {
      console.error(err);
    }
    runInAction(() => {
      state.loadingSeed = false;
    });
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  return (
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
          <Tooltip
            disableHoverListener={!!state.seedString}
            placement="top"
            title={lang.selectSeedToJoin}
            arrow
          >
            <div className="px-8 py-2 mt-7">
              <Button
                fullWidth
                color="primary"
                isDoing={state.loadingSeed}
                onClick={handleSelectFile}
                disabled={state.loading}
              >
                {lang.selectSeedFile}
              </Button>
            </div>
          </Tooltip>

          <div className="mt-1 text-12 text-gray-500 flex items-center justify-center pb-1">
            {lang.or}&nbsp;
            {lang.paste} <GoChevronRight className="text-12 opacity-80" />
          </div>

          <TextField
            className="w-full"
            placeholder={lang.pasteSeedText}
            size="small"
            multiline
            minRows={6}
            maxRows={6}
            value={state.seedString}
            autoFocus
            onChange={action((e) => { state.seedString = e.target.value; })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />

          <div className="mt-6 pt-[2px]">
            <Button
              fullWidth
              isDoing={state.loading}
              isDone={state.done}
              disabled={!state.seedString}
              onClick={submit}
            >
              {lang.yes}
            </Button>
            <div
              className="mt-2 pt-[2px] text-gray-500 hover:text-black text-12 cursor-pointer text-center opacity-70"
              onClick={() => {
                if (process.env.IS_ELECTRON) {
                  shell.openExternal('https://docs.prsdev.club/#/rum-app/');
                } else {
                  window.open('https://docs.prsdev.club/#/rum-app/');
                }
              }}
            >
              {lang.availablePublicGroups}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
});

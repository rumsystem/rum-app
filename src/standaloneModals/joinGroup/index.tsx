import React from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs-extra';
import { ipcRenderer, shell } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { TextField, Tooltip } from '@mui/material';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import isV2Seed from 'utils/isV2Seed';
import { lang } from 'utils/lang';
import { useJoinGroup } from 'hooks/useJoinGroup';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';

export const joinGroup = async (seed?: string) => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <JoinGroup
          seed={seed}
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});

interface Props {
  rs: () => unknown
  seed?: string
}

const JoinGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    loading: false,
    done: false,
    loadingSeed: false,
    seed: props.seed ?? '',
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

    let seedJson: any;
    try {
      seedJson = isV2Seed(state.seed) ? QuorumLightNodeSDK.utils.restoreSeedFromUrl(state.seed) : JSON.parse(state.seed);
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

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  return (
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
  );
});

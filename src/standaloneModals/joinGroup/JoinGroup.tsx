import React from 'react';
import fs from 'fs/promises';
import { ipcRenderer, shell } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { TextField, Tooltip } from '@mui/material';
import { GoChevronRight } from 'react-icons/go';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import { sleep, isV2Seed, runLoading } from 'utils';
import { useJoinGroup } from 'hooks/useJoinGroup';
import rumsdk from 'rum-sdk-browser';

export interface Props {
  seed?: string
  rs: () => unknown
}

export const JoinGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    loading: false,
    done: false,
    loadingSeed: false,
    seed: props.seed ?? '',
    privateKey: {
      open: false,
      input: '',
      key: '',
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

  const handleConfirmPrivateKey = () => {

  };

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

          {/* <div
            className="mt-2 flex flex-center cursor-pointer font-bold text-12 text-gray-500 opacity-90"
            onClick={action(() => { state.privateKey.open = true; })}
          >
            手动输入私钥
            <GoChevronRight className="text-12 opacity-80" />
          </div> */}

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
          <TextField
            className="w-full text-12 px-4 pt-5"
            placeholder="输入 eth key"
            size="small"
            multiline
            minRows={6}
            maxRows={6}
            value={state.privateKey.input}
            autoFocus
            onChange={action((e) => { state.privateKey.input = e.target.value; })}
            margin="dense"
            variant="outlined"
          />

          <div className="mt-4 pt-[2px]">
            <Button fullWidth onClick={handleConfirmPrivateKey}>
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </>);
});

import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import fs from 'fs-extra';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { clipboard, dialog } from '@electron/remote';
import { IconButton, OutlinedInput } from '@material-ui/core';
import { IoMdCopy } from 'react-icons/io';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { useJoinGroup } from 'hooks/useJoinGroup';

export const shareGroup = async (groupId: string) => new Promise<void>((rs) => {
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
          <ShareGroup
            groupId={groupId}
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

export const shareSeed = async (seed: string) => new Promise<void>((rs) => {
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
          <ShareGroup
            seed={seed}
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

type Props = { rs: () => unknown } & ({ groupId: string } | { seed: string });

const ShareGroup = observer((props: Props) => {
  const {
    snackbarStore,
    seedStore,
    nodeStore,
    groupStore,
    activeGroupStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    open: true,
    done: false,
    loading: false,
    seed: null as any,
    groupName: '',
    get inGroup() {
      return groupStore.hasGroup(state.seed?.group_id);
    },
  }));
  const joinGroupProcess = useJoinGroup();
  const isActiveGroupSeed = activeGroupStore.id === state.seed?.group_id;

  const handleDownloadSeed = async () => {
    try {
      const file = await dialog.showSaveDialog({
        defaultPath: `seed.${state.groupName}.json`,
      });
      if (!file.canceled && file.filePath) {
        await fs.writeFile(
          file.filePath.toString(),
          JSON.stringify(state.seed, null, 2),
        );
        await sleep(400);
        handleClose();
        snackbarStore.show({
          message: lang.downloadedThenShare,
          duration: 2500,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    clipboard.writeText(JSON.stringify(state.seed, null, 2));
    snackbarStore.show({
      message: lang.copied,
    });
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const handleJoinOrOpen = async () => {
    const groupId = state.seed?.group_id;
    if (state.inGroup) {
      if (activeGroupStore.switchLoading) {
        return;
      }
      handleClose();
      await sleep(400);
      if (activeGroupStore.id !== groupId) {
        activeGroupStore.setSwitchLoading(true);
        activeGroupStore.setId(groupId);
      }
      return;
    }
    if (state.loading) {
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

  React.useEffect(action(() => {
    if ('groupId' in props) {
      seedStore.getSeed(
        nodeStore.storagePath,
        props.groupId,
      ).then(action((seed) => {
        state.seed = seed;
        state.open = true;
      }));

      const group = groupStore.map[props.groupId];
      if (group) {
        state.groupName = group.group_name;
      }
    } else {
      try {
        const seed = JSON.parse(props.seed);
        state.seed = seed;
        state.groupName = seed.group_name;
      } catch (e) {
      }
    }
  }), []);

  return (
    <Dialog
      open={state.open}
      maxWidth={false}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 text-center py-10 px-12 max-w-[500px]">
        <div className="text-18 font-medium text-gray-4a break-all">
          {isActiveGroupSeed ? lang.shareSeed : lang.seedNet}
          {!!state.groupName && `: ${state.groupName}`}
        </div>
        <div className="px-3">
          <OutlinedInput
            className="mt-6 w-90 p-0"
            onFocus={(e) => e.target.select()}
            classes={{ input: 'p-4 text-gray-af focus:text-gray-70' }}
            value={JSON.stringify(state.seed, null, 2)}
            multiline
            minRows={6}
            maxRows={6}
            spellCheck={false}
            endAdornment={(
              <div className="self-stretch absolute right-0">
                <IconButton onClick={handleCopy}>
                  <IoMdCopy className="text-20" />
                </IconButton>
              </div>
            )}
          />
        </div>

        {isActiveGroupSeed && (
          <div className="text-14 text-gray-9b mt-4">
            {lang.copySeed}
          </div>
        )}

        <div className="flex justify-center mt-5 gap-x-4">
          <Button onClick={handleDownloadSeed} outline={!isActiveGroupSeed}>
            {lang.downloadSeed}
          </Button>
          {!isActiveGroupSeed && (
            <Button
              onClick={handleJoinOrOpen}
              isDoing={state.loading}
              isDone={state.done}
            >
              {state.inGroup ? lang.openSeedGroup : lang.joinSeedGroup}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
});

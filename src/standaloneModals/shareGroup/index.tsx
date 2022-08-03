import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import fs from 'fs-extra';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { dialog } from '@electron/remote';
import { OutlinedInput } from '@material-ui/core';
import { IoMdCopy } from 'react-icons/io';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { setClipboard } from 'utils/setClipboard';
import { useJoinGroup } from 'hooks/useJoinGroup';
import GroupApi from 'apis/group';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
import isV2Seed from 'utils/isV2Seed';

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
    groupStore,
    activeGroupStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    open: true,
    done: false,
    loading: false,
    seedJson: null as any,
    seed: '',
    groupName: '',
    get inGroup() {
      return groupStore.hasGroup(state.seedJson?.group_id) && !state.loading;
    },
  }));
  const joinGroupProcess = useJoinGroup();
  const isActiveGroupSeed = activeGroupStore.id === state.seedJson?.group_id;

  const handleDownloadSeed = async () => {
    try {
      const seed = state.seed;
      const seedName = `seed.${state.groupName}.json`;
      if (!process.env.IS_ELECTRON) {
        // TODO: remove any in ts4.6
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: seedName,
          types: [{
            description: 'json file',
            accept: { 'text/json': ['.json'] },
          }],
        }).catch(() => null);
        if (!handle) {
          return;
        }
        const writableStream = await handle.createWritable();
        writableStream.write(seed);
        writableStream.close();
      } else {
        const file = await dialog.showSaveDialog({
          defaultPath: seedName,
        });
        if (file.canceled || !file.filePath) {
          return;
        }
        await fs.writeFile(file.filePath.toString(), seed);
      }
      await sleep(400);
      handleClose();
      snackbarStore.show({
        message: lang.downloadedThenShare,
        duration: 2500,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    setClipboard(state.seed);
    snackbarStore.show({
      message: lang.copied,
    });
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const handleJoinOrOpen = async () => {
    const groupId = state.seedJson?.group_id;
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
      await joinGroupProcess(state.seed, handleClose);
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
      (async () => {
        try {
          if (props.groupId) {
            const { seed } = await GroupApi.fetchSeed(props.groupId);
            state.seedJson = QuorumLightNodeSDK.utils.restoreSeedFromUrl(seed);
            state.seed = seed;
            state.open = true;
            const group = groupStore.map[props.groupId];
            if (group) {
              state.groupName = group.group_name;
            }
          }
        } catch (_) {}
      })();
    } else {
      try {
        const seedJson = isV2Seed(props.seed) ? QuorumLightNodeSDK.utils.restoreSeedFromUrl(props.seed) : JSON.parse(props.seed);
        state.seed = props.seed;
        state.seedJson = seedJson;
        state.groupName = seedJson.group_name;
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
      data-test-id="share-group-modal"
    >
      <div
        className="bg-white rounded-0 text-center py-8 px-10 max-w-[500px]"
      >
        <div className="text-18 font-medium text-gray-4a break-all">
          {isActiveGroupSeed ? lang.shareSeed : lang.seedNet}
          {/* {!!state.groupName && `: ${state.groupName}`} */}
        </div>
        <div className="px-3">
          <OutlinedInput
            className="mt-6 w-100 p-0"
            inputProps={{
              'data-test-id': 'share-group-textarea',
            }}
            onFocus={(e) => e.target.select()}
            classes={{ input: 'p-4 text-12 leading-normal text-gray-9b' }}
            value={state.seed}
            multiline
            minRows={6}
            maxRows={10}
            spellCheck={false}
          />
        </div>

        <div className="text-16 text-gray-9b mt-5 flex justify-center items-center">
          <span
            className="text-link-blue cursor-pointer inline-flex items-center"
            onClick={handleCopy}
          >
            <IoMdCopy className="text-22 mr-1 inline" />
            {lang.copySeed}
          </span>
          <span>
            &nbsp;{lang.copySeedOr}
          </span>
        </div>

        <div className="flex justify-center mt-5 gap-x-4">
          <Button
            className="rounded-full !text-16"
            size="large"
            onClick={handleDownloadSeed}
          >
            {lang.downloadSeed}
          </Button>
          {!isActiveGroupSeed && (
            <Button
              className="rounded-full !text-16"
              size="large"
              onClick={handleJoinOrOpen}
              outline
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

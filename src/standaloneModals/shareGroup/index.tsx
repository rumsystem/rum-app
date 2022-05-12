import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import fs from 'fs-extra';
import { action } from 'mobx';
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
  const state = useLocalObservable(() => ({
    open: true,
    seed: '',
    groupName: '',
  }));
  const {
    snackbarStore,
    seedStore,
    nodeStore,
    groupStore,
  } = useStore();

  const handleDownloadSeed = async () => {
    try {
      const file = await dialog.showSaveDialog({
        defaultPath: `seed.${state.groupName}.json`,
      });
      if (!file.canceled && file.filePath) {
        await fs.writeFile(
          file.filePath.toString(),
          state.seed,
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
    clipboard.writeText(state.seed);
    snackbarStore.show({
      message: lang.copied,
    });
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  React.useEffect(action(() => {
    if ('groupId' in props) {
      seedStore.getSeed(
        nodeStore.storagePath,
        props.groupId,
      ).then(action((seed) => {
        state.seed = JSON.stringify(seed, null, 2);
        state.open = true;
      }));

      const group = groupStore.map[props.groupId];
      if (group) {
        state.groupName = group.group_name;
      }
    } else {
      state.seed = props.seed;
      try {
        const seed = JSON.parse(props.seed);
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
          {lang.shareSeed}
          {!!state.groupName && `: ${state.groupName}`}
        </div>
        <div className="px-3">
          <OutlinedInput
            className="mt-6 w-90 p-0"
            onFocus={(e) => e.target.select()}
            classes={{ input: 'p-4 text-gray-af focus:text-gray-70' }}
            value={state.seed}
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

        <div className="text-14 text-gray-9b mt-4">
          {lang.copySeed}
        </div>

        <div className="mt-5">
          <Button onClick={handleDownloadSeed}>
            {lang.downloadSeed}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});

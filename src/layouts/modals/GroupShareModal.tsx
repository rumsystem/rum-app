import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { clipboard, dialog } from '@electron/remote';
import fs from 'fs-extra';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { IconButton, TextField } from '@material-ui/core';
import { IoMdCopy } from 'react-icons/io';
import { reaction, runInAction } from 'mobx';

export default observer(() => {
  const state = useLocalObservable(() => ({
    seed: '',
  }));
  const { snackbarStore, seedStore, nodeStore, modalStore } = useStore();
  const activeGroup = useActiveGroup();

  const handleDownloadSeed = async () => {
    try {
      const file = await dialog.showSaveDialog({
        defaultPath: `seed.${activeGroup.GroupName}.json`,
      });
      if (!file.canceled && file.filePath) {
        await fs.writeFile(
          file.filePath.toString(),
          state.seed,
        );
        await sleep(400);
        modalStore.groupShare.close();
        await sleep(400);
        snackbarStore.show({
          message: '已下载，去分享给好友吧~',
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
      message: '已复制种子文件',
    });
  };

  React.useEffect(() => reaction(
    () => modalStore.groupShare.show,
    async () => {
      if (!modalStore.groupShare.show) {
        return;
      }
      const seed = await seedStore.getSeed(
        nodeStore.storagePath,
        activeGroup.GroupId,
      );
      runInAction(() => {
        state.seed = JSON.stringify(seed, null, 2);
      });
    },
  ), []);

  return (
    <Dialog
      open={modalStore.groupShare.show}
      maxWidth={false}
      onClose={() => modalStore.groupShare.close()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-12 text-center py-12 px-20">
        <div className="text-24 font-medium text-gray-4a">
          分享群组种子
        </div>
        <TextField
          className="mt-8 w-120"
          variant="outlined"
          value={state.seed}
          multiline
          minRows={4}
          maxRows={4}
          spellCheck={false}
          InputProps={{
            classes: {
              input: 'text-gray-bf focus:text-gray-70',
            },
            endAdornment: (
              <div className="self-stretch absolute right-0 mr-4">
                <IconButton onClick={handleCopy}>
                  <IoMdCopy className="text-20" />
                </IconButton>
              </div>
            ),
          }}
        />

        <div className="text-18 text-gray-9b mt-4">
          请复制以上种子或者直接下载种子文件
        </div>

        <div className="mt-5">
          <Button onClick={handleDownloadSeed}>
            <div className="text-20 px-16 py-1">
              下载种子文件
            </div>
          </Button>
        </div>
      </div>
    </Dialog>
  );
});

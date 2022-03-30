import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { dialog } from '@electron/remote';
import fs from 'fs-extra';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import useActiveGroup from 'store/selectors/useActiveGroup';

export default observer(() => {
  const { snackbarStore, seedStore, nodeStore, modalStore } = useStore();
  const activeGroup = useActiveGroup();

  return (
    <Dialog
      open={modalStore.groupShare.show}
      onClose={() => modalStore.groupShare.close()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-12 text-center p-8">
        <div className="w-64">
          <div className="text-18 font-bold text-gray-700">分享群组</div>
          <div className="mt-4 text-gray-9b tracking-wide leading-loose">
            加入群组需要使用
            <strong className="text-gray-4a ml-2-px">种子文件</strong>，
            <br />
            你可以下载种子文件，
            <br />
            把它分享给要加入群组的好友
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              onClick={async () => {
                const seed = await seedStore.getSeed(
                  nodeStore.storagePath,
                  activeGroup.GroupId,
                );
                if (!seed) {
                  snackbarStore.show({
                    message: '出错了，找不到种子文件',
                    type: 'error',
                  });
                  return;
                }
                try {
                  const file = await dialog.showSaveDialog({
                    defaultPath: `seed.${activeGroup.GroupName}.json`,
                  });
                  if (!file.canceled && file.filePath) {
                    await fs.writeFile(
                      file.filePath.toString(),
                      JSON.stringify(seed),
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
              }}
            >
              下载种子文件
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});

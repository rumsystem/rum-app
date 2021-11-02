import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep } from 'utils';
import { useStore } from 'store';

const pWriteFile = util.promisify(fs.writeFile);

interface IProps {
  open: boolean;
  onClose: () => void;
}

const Share = observer((props: IProps) => {
  const { snackbarStore, groupStore } = useStore();
  const state = useLocalStore(() => ({
    name: '',
    loading: false,
    seed: {},
  }));

  return (
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
              if (!groupStore.groupSeed) {
                snackbarStore.show({
                  message: '出错了，找不到种子文件',
                  type: 'error',
                });
                return;
              }
              try {
                const file = await remote.dialog.showSaveDialog({
                  defaultPath: `seed.${groupStore.group.GroupName}.json`,
                });
                if (!file.canceled && file.filePath) {
                  await pWriteFile(
                    file.filePath.toString(),
                    JSON.stringify(groupStore.groupSeed)
                  );
                  await sleep(400);
                  props.onClose();
                  await sleep(400);
                  snackbarStore.show({
                    message: '已下载，去分享给好友吧~',
                    duration: 2500,
                  });
                }
              } catch (err) {
                console.log(err.message);
              }
            }}
          >
            下载种子文件
          </Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      disableBackdropClick={false}
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Share {...props} />
    </Dialog>
  );
});

import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { BiChevronRight } from 'react-icons/bi';
import { sleep } from 'utils';
import { useStore } from 'store';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ModeSelector = observer(() => {
  const { nodeStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    showNodePortModal: false,
    port: '',
  }));

  const changeExternalNodePort = async () => {
    snackbarStore.show({
      message: '成功指定端口',
    });
    await sleep(1500);
    nodeStore.setMode('EXTERNAL');
    nodeStore.setPort(Number(state.port));
    window.location.reload();
  };

  return (
    <div className="p-8 relative">
      <div className="w-60">
        <div
          className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
          onClick={async () => {
            snackbarStore.show({
              message: '已选择内置节点',
            });
            await sleep(1500);
            nodeStore.setMode('INTERNAL');
            window.location.reload();
          }}
        >
          <div>
            <div className="text-indigo-400">内置节点</div>
            <div className="text-gray-af text-12">使用客户端内置的节点</div>
          </div>
          <BiChevronRight className="text-gray-bd text-20" />
        </div>
        <div
          className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
          onClick={async () => {
            state.showNodePortModal = true;
          }}
        >
          <div>
            <div className="text-indigo-400">开发节点</div>
            <div className="text-gray-af text-12">连接本地开发的节点</div>
          </div>
          <BiChevronRight className="text-gray-bd text-20" />
        </div>
      </div>
      <Dialog
        disableBackdropClick={false}
        open={state.showNodePortModal}
        onClose={() => (state.showNodePortModal = false)}
        transitionDuration={{
          enter: 300,
        }}
      >
        <div className="bg-white rounded-12 text-center py-8 px-12">
          <div className="w-50">
            <div className="text-18 font-bold text-gray-700">指定端口</div>
            <div className="pt-3">
              <TextField
                className="w-full"
                placeholder="开发节点的端口"
                size="small"
                value={state.port}
                autoFocus
                onChange={(e) => {
                  state.port = e.target.value.trim();
                }}
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) {
                    e.preventDefault();
                    e.target.blur();
                    changeExternalNodePort();
                  }
                }}
                margin="dense"
                variant="outlined"
              />
            </div>
            <div className="mt-6" onClick={changeExternalNodePort}>
              <Button fullWidth>确定</Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      disableBackdropClick={true}
      hideCloseButton
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ModeSelector />
    </Dialog>
  );
});

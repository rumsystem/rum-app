import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { BiChevronRight } from 'react-icons/bi';
import { DEFAULT_BOOTSTRAP_ID } from 'utils/constant';
import { sleep } from 'utils';
import { useStore } from 'store';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ModeSelector = observer((props: IProps) => {
  const { nodeStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    showNodePortModal: false,
    port: '',
  }));

  const changeCustomNodePort = async () => {
    snackbarStore.show({
      message: '成功指定端口',
    });
    await sleep(1500);
    nodeStore.setCustomPort(Number(state.port));
    window.location.reload();
  };

  return (
    <div className="p-8 relative">
      <div className="w-60">
        <div
          className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
          onClick={async () => {
            props.onClose();
            nodeStore.setBootstrapId(DEFAULT_BOOTSTRAP_ID);
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
                    changeCustomNodePort();
                  }
                }}
                margin="dense"
                variant="outlined"
              />
            </div>
            <div className="mt-6" onClick={changeCustomNodePort}>
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
      <ModeSelector {...props} />
    </Dialog>
  );
});

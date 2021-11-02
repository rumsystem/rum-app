import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import { sleep } from 'utils';
import * as Quorum from 'utils/quorum';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ExternalNodeSettingModal = observer(() => {
  const { nodeStore, snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    apiHost: nodeStore.storeApiHost || '',
    port: nodeStore.port ? String(nodeStore.port) : '',
  }));

  const changeExternalNode = async () => {
    snackbarStore.show({
      message: '设置成功',
    });
    if (nodeStore.status.up) {
      Quorum.down();
    }
    await sleep(1500);
    nodeStore.setMode('EXTERNAL');
    nodeStore.setPort(Number(state.port));
    if (state.apiHost && state.apiHost !== nodeStore.apiHost) {
      nodeStore.setApiHost(state.apiHost);
    }
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-56">
        <div className="text-18 font-bold text-gray-700">指定开发节点</div>
        <div className="pt-5">
          <TextField
            className="w-full"
            placeholder="端口"
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
                changeExternalNode();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder="127.0.0.1（可选）"
            size="small"
            value={state.apiHost}
            onChange={(e) => {
              state.apiHost = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                changeExternalNode();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6" onClick={changeExternalNode}>
          <Button fullWidth>确定</Button>
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
      <ExternalNodeSettingModal />
    </Dialog>
  );
});

import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import { sleep } from 'utils';
import copy from 'copy-to-clipboard';
import * as Quorum from 'utils/quorum';
import { remote } from 'electron';
import MiddleTruncate from 'components/MiddleTruncate';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const MyNodeInfo = observer(() => {
  const { groupStore, nodeStore, snackbarStore, confirmDialogStore } =
    useStore();

  const state = useLocalStore(() => ({
    port: nodeStore.port,
    showPortModal: false,
  }));

  const changeExternalNodePort = async () => {
    snackbarStore.show({
      message: '修改成功',
    });
    if (nodeStore.status.up) {
      Quorum.down();
    }
    await sleep(1500);
    nodeStore.setMode('EXTERNAL');
    nodeStore.setPort(state.port);
    window.location.reload();
  };

  const useInternalNode = async () => {
    snackbarStore.show({
      message: '修改成功',
    });
    await sleep(1500);
    nodeStore.setMode('INTERNAL');
    nodeStore.resetPort();
    window.location.reload();
  };

  const shutdownNode = async () => {
    confirmDialogStore.show({
      content: '重置之后，所有群组和消息将全部丢失，请谨慎操作',
      okText: '确定重置',
      isDangerous: true,
      ok: async () => {
        nodeStore.setMode('');
        groupStore.reset();
        nodeStore.resetPort();
        nodeStore.resetPeerName();
        Quorum.down();
        await sleep(200);
        window.location.reload();
      },
    });
  };

  return (
    <div className="bg-white rounded-12 p-8">
      <div className="w-70">
        <div className="text-18 font-bold text-gray-700 text-center">
          我的节点
        </div>
        <div className="mt-6">
          <div className="text-gray-500 font-bold">ID</div>
          <div className="flex mt-1">
            <div className="p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0">
              <MiddleTruncate string={nodeStore.info.user_id} length={15} />
            </div>
            <Button
              noRound
              className="rounded-r-12"
              size="small"
              onClick={() => {
                copy(nodeStore.info.user_id);
                snackbarStore.show({
                  message: '已复制',
                });
              }}
            >
              复制
            </Button>
          </div>
        </div>
        {nodeStore.canUseExternalMode && (
          <div className="mt-6">
            <div className="text-gray-500 font-bold">端口</div>
            <div className="flex mt-1">
              <div className="p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0">
                {state.port}
              </div>
              <Button
                noRound
                className="rounded-r-12"
                size="small"
                onClick={() => {
                  state.showPortModal = true;
                }}
              >
                修改
              </Button>
            </div>
          </div>
        )}
        <div className="mt-6">
          <div className="text-gray-500 font-bold">状态和版本</div>
          <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 rounded-10 p-2">
            {nodeStore.network.node.nat_type === 'Public' && (
              <div className="flex items-center text-green-500">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                Public
              </div>
            )}
            {nodeStore.network.node.nat_type !== 'Public' && (
              <div className="flex items-center text-red-400">
                <div className="w-2 h-2 bg-red-300 rounded-full mr-2"></div>
                {nodeStore.network.node.nat_type}
              </div>
            )}
            <div className="px-4">|</div>
            <div>
              版本 {remote.app.getVersion()}
              {nodeStore.info.node_version.replace('ver', '')}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button fullWidth color="red" outline onClick={shutdownNode}>
            重置节点
          </Button>
        </div>
      </div>
      <Dialog
        disableBackdropClick={false}
        open={state.showPortModal}
        onClose={() => (state.showPortModal = false)}
        transitionDuration={{
          enter: 300,
        }}
      >
        <div className="bg-white rounded-12 text-center py-8 px-12">
          <div className="w-50">
            <div className="text-18 font-bold text-gray-700">修改端口</div>
            <div className="pt-4">
              <TextField
                className="w-full"
                placeholder="端口"
                size="small"
                value={state.port}
                autoFocus
                onChange={(e) => {
                  state.port = Number(e.target.value.trim());
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
            {nodeStore.mode === 'EXTERNAL' && (
              <div
                className="mt-3 text-indigo-400 text-12 cursor-pointer text-center"
                onClick={useInternalNode}
              >
                切换到内置节点
              </div>
            )}
          </div>
        </div>
      </Dialog>
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
      <MyNodeInfo />
    </Dialog>
  );
});

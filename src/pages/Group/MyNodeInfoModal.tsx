import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import { sleep } from 'utils';
import copy from 'copy-to-clipboard';
import Tooltip from '@material-ui/core/Tooltip';
import { useHistory } from 'react-router-dom';
import * as Quorum from 'utils/quorum';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const MyNodeInfo = observer(() => {
  const { groupStore, snackbarStore } = useStore();
  const { nodeInfo } = groupStore;
  const history = useHistory();

  const state = useLocalStore(() => ({
    port: groupStore.nodePort,
    showPortModal: false,
  }));

  const changePort = async () => {
    snackbarStore.show({
      message: '修改成功，即将重启圈子',
    });
    await sleep(1500);
    groupStore.setNodePort(state.port);
    window.location.reload();
  };

  const shutdownNode = () => {
    groupStore.shutdownNode();
    Quorum.down();
    history.replace('/dashboard');
    snackbarStore.show({
      message: '已退出',
    });
  };

  return (
    <div className="bg-white rounded-12 p-8">
      <div className="w-70">
        <div className="text-18 font-bold text-gray-700 text-center">
          我的节点
        </div>
        <div className="mt-6">
          <div className="text-gray-500 font-bold">Public Key</div>
          <div className="flex mt-1">
            <Tooltip
              placement="left"
              title={nodeInfo.node_publickey}
              arrow
              interactive
            >
              <div className="p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0">
                {nodeInfo.node_publickey.slice(0, 10) +
                  '...' +
                  nodeInfo.node_publickey.slice(-20)}
              </div>
            </Tooltip>
            <Button
              noRound
              className="rounded-r-12"
              size="small"
              onClick={() => {
                copy(nodeInfo.node_publickey);
                snackbarStore.show({
                  message: '已复制',
                });
              }}
            >
              复制
            </Button>
          </div>
        </div>
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
        <div className="mt-6">
          <div className="text-gray-500 font-bold">状态和版本</div>
          <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 rounded-10 p-2">
            {nodeInfo.node_status === 'NODE_ONLINE' && (
              <div className="flex items-center text-green-500">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                在线
              </div>
            )}
            {nodeInfo.node_status !== 'NODE_ONLINE' && (
              <div className="flex items-center text-red-400">
                <div className="w-2 h-2 bg-red-300 rounded-full mr-2"></div>
                {nodeInfo.node_status}
              </div>
            )}
            <div className="px-4">|</div>
            <div>{nodeInfo.node_version.replace('ver', '版本')}</div>
          </div>
        </div>
        <div className="mt-8">
          <Button fullWidth color="red" outline onClick={shutdownNode}>
            退出
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
            <div className="pt-3">
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
                    changePort();
                  }
                }}
                margin="dense"
                variant="outlined"
              />
            </div>
            {groupStore.isNodeUsingCustomPort && (
              <div
                className="mt-1 text-indigo-400 text-12 cursor-pointer text-left"
                onClick={() => {
                  state.port = groupStore.nodeStatus.port;
                  groupStore.setNodePort(groupStore.nodeStatus.port);
                }}
              >
                点击使用默认端口
              </div>
            )}
            <div className="mt-6" onClick={changePort}>
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

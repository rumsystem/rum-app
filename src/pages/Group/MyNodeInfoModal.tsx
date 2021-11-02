import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { sleep } from 'utils';
import copy from 'copy-to-clipboard';
import * as Quorum from 'utils/quorum';
import { remote } from 'electron';
import MiddleTruncate from 'components/MiddleTruncate';
import ExternalNodeSettingModal from './ExternalNodeSettingModal';
import StoragePathSettingModal from './StoragePathSettingModal';
import Tooltip from '@material-ui/core/Tooltip';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const MyNodeInfo = observer(() => {
  const {
    groupStore,
    nodeStore,
    snackbarStore,
    confirmDialogStore,
    modalStore,
  } = useStore();

  const state = useLocalStore(() => ({
    port: nodeStore.port,
    showExternalNodeSettingModal: false,
    showStoragePathSettingModal: false,
  }));

  const shutdownNode = async () => {
    confirmDialogStore.show({
      content: '重置之后，所有群组和消息将全部丢失，请谨慎操作',
      okText: '确定重置',
      isDangerous: true,
      ok: async () => {
        const { storagePath } = nodeStore;
        groupStore.resetElectronStore();
        nodeStore.resetElectronStore();
        nodeStore.setStoragePath(storagePath);
        confirmDialogStore.setLoading(true);
        await Quorum.down();
        await nodeStore.resetStorage();
        confirmDialogStore.hide();
        await sleep(300);
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
              <MiddleTruncate string={nodeStore.info.node_id} length={15} />
            </div>
            <Button
              noRound
              className="rounded-r-12"
              size="small"
              onClick={() => {
                copy(nodeStore.info.node_id);
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
            <div className="text-gray-500 font-bold">开发节点</div>
            <div className="flex mt-1">
              <div className="p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0 tracking-wider">
                {nodeStore.apiHost}:{nodeStore.port}
              </div>
              <Button
                noRound
                className="rounded-r-12"
                size="small"
                onClick={() => {
                  state.showExternalNodeSettingModal = true;
                }}
              >
                修改
              </Button>
            </div>
          </div>
        )}
        {nodeStore.mode === 'INTERNAL' && (
          <div className="mt-6">
            <div className="text-gray-500 font-bold">储存目录</div>
            <div className="flex mt-1">
              <div className="p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0">
                <Tooltip
                  placement="top"
                  title={nodeStore.storagePath}
                  arrow
                  interactive
                >
                  <div>
                    {nodeStore.storagePath.length > 24
                      ? `../..${nodeStore.storagePath.slice(-24)}`
                      : nodeStore.storagePath}
                  </div>
                </Tooltip>
              </div>
              <Button
                noRound
                className="rounded-r-12"
                size="small"
                onClick={() => {
                  state.showStoragePathSettingModal = true;
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
            <Tooltip
              placement="top"
              title={`quorum latest commit: ${
                nodeStore.info.node_version.split(' - ')[1]
              }`}
              interactive
              arrow
            >
              <div>版本 {remote.app.getVersion()}</div>
            </Tooltip>
          </div>
        </div>
        {nodeStore.mode === 'INTERNAL' && (
          <div className="mt-8">
            <Button fullWidth color="red" outline onClick={shutdownNode}>
              重置节点
            </Button>
          </div>
        )}
      </div>
      <ExternalNodeSettingModal
        open={state.showExternalNodeSettingModal}
        onClose={() => (state.showExternalNodeSettingModal = false)}
      />
      <StoragePathSettingModal
        open={state.showStoragePathSettingModal}
        onClose={async (changed) => {
          state.showStoragePathSettingModal = false;
          if (changed) {
            if (nodeStore.status.up) {
              modalStore.pageLoading.show();
              await Quorum.down();
            }
            window.location.reload();
          }
        }}
      />
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

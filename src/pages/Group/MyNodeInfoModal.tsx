import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import copy from 'copy-to-clipboard';
import * as Quorum from 'utils/quorum';
import { remote } from 'electron';
import MiddleTruncate from 'components/MiddleTruncate';
import ExternalNodeSettingModal from './ExternalNodeSettingModal';
import StoragePathSettingModal from './StoragePathSettingModal';
import NetworkInfoModal from './NetworkInfoModal';
import Tooltip from '@material-ui/core/Tooltip';
import { GoChevronRight } from 'react-icons/go';
import useShutdownNode from 'hooks/useShutdownNode';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const MyNodeInfo = observer(() => {
  const { nodeStore, snackbarStore, modalStore } = useStore();

  const shutdownNode = useShutdownNode();

  const state = useLocalObservable(() => ({
    port: nodeStore.port,
    showExternalNodeSettingModal: false,
    showStoragePathSettingModal: false,
    showNetworkInfoModal: false,
  }));

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
              <MiddleTruncate
                string={nodeStore.info.node_publickey}
                length={15}
              />
            </div>
            <Button
              noRound
              className="rounded-r-12"
              size="small"
              onClick={() => {
                copy(nodeStore.info.node_publickey);
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
          <div className="text-gray-500 font-bold">版本和状态</div>
          <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 rounded-10 p-2">
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
            <div className="px-4">|</div>
            <div
              className="flex items-center hover:font-bold cursor-pointer"
              onClick={() => (state.showNetworkInfoModal = true)}
            >
              网络状态
              <GoChevronRight className="text-14 ml-[1px] opacity-90" />
            </div>
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
      <NetworkInfoModal
        open={state.showNetworkInfoModal}
        onClose={() => (state.showNetworkInfoModal = false)}
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

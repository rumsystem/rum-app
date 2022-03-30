import React from 'react';
import { ipcRenderer } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import copy from 'copy-to-clipboard';
import { app } from '@electron/remote';
import MiddleTruncate from 'components/MiddleTruncate';
import NetworkInfoModal from './NetworkInfoModal';
import NodeParamsModal from './NodeParamsModal';
import Tooltip from '@material-ui/core/Tooltip';
import sleep from 'utils/sleep';
import formatPath from 'utils/formatPath';
import useCloseNode from 'hooks/useCloseNode';
import useResetNode from 'hooks/useResetNode';
import { lang } from 'utils/lang';

const MyNodeInfo = observer(() => {
  const {
    nodeStore,
    snackbarStore,
    confirmDialogStore,
    modalStore,
  } = useStore();

  const state = useLocalObservable(() => ({
    port: nodeStore.apiConfig.port,
    showNetworkInfoModal: false,
    showNodeParamsModal: false,
  }));

  const closeNode = useCloseNode();
  const resetNode = useResetNode();

  const onExitNode = React.useCallback(() => {
    confirmDialogStore.show({
      content: lang.confirmToExitNode,
      okText: lang.yes,
      isDangerous: true,
      ok: async () => {
        ipcRenderer.send('disable-app-quit-prompt');
        confirmDialogStore.setLoading(true);
        await sleep(800);
        confirmDialogStore.hide();
        modalStore.myNodeInfo.close();
        if (nodeStore.mode === 'INTERNAL') {
          await closeNode();
        }
        resetNode();
        await sleep(300);
        window.location.reload();
      },
    });
  }, []);

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-70">
        <div className="text-18 font-bold text-gray-700 text-center">
          {lang.nodeInfo}
        </div>
        <div className="mt-6">
          <div className="text-gray-500 font-bold opacity-90">ID</div>
          <div className="flex mt-1">
            <div className="p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 rounded-l-0 border-r-0">
              <MiddleTruncate
                string={nodeStore.info.node_publickey}
                length={13}
              />
            </div>
            <Button
              className="rounded-r-0"
              size="small"
              onClick={() => {
                copy(nodeStore.info.node_publickey);
                snackbarStore.show({
                  message: lang.copied,
                });
              }}
            >
              {lang.copy}
            </Button>
          </div>
        </div>
        {nodeStore.mode === 'EXTERNAL' && (
          <div className="mt-6">
            <div className="text-gray-500 font-bold opacity-90">{lang.externalNode}</div>
            <div className="mt-2 text-12 text-gray-500 bg-gray-100 border border-gray-200 rounded-0 py-2 px-4">
              {nodeStore.apiConfig.host || '127.0.0.1'}:{nodeStore.apiConfig.port}
            </div>
          </div>
        )}
        <div className="mt-6">
          <div className="text-gray-500 font-bold opacity-90">{lang.storageDir}</div>
          <div className="mt-2 text-12 text-gray-500 bg-gray-100 border border-gray-200 rounded-0 py-2 px-4">
            <Tooltip
              placement="top"
              title={nodeStore.storagePath}
              arrow
              interactive
            >
              <div className="tracking-wide">
                {formatPath(nodeStore.storagePath, { truncateLength: 27 })}
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-gray-500 font-bold opacity-90">{lang.detail}</div>
          <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 border border-gray-200 rounded-0 py-2 px-4">
            <Tooltip
              placement="top"
              title={`quorum latest commit: ${
                nodeStore.info.node_version.split(' - ')[1]
              }`}
              interactive
              arrow
            >
              <div>{lang.version} {app.getVersion()}</div>
            </Tooltip>
            <div className="px-4">|</div>
            <div
              className="flex items-center hover:font-bold cursor-pointer"
              onClick={() => { state.showNodeParamsModal = true; }}
            >
              {lang.nodeParams}
            </div>
            <div className="px-4">|</div>
            <div
              className="flex items-center hover:font-bold cursor-pointer"
              onClick={() => { state.showNetworkInfoModal = true; }}
            >
              {lang.networkStatus}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Button fullWidth color="red" outline onClick={onExitNode}>
            {lang.exitNode}
          </Button>
        </div>
      </div>
      <NetworkInfoModal
        open={state.showNetworkInfoModal}
        onClose={() => { state.showNetworkInfoModal = false; }}
      />
      <NodeParamsModal
        open={state.showNodeParamsModal}
        onClose={() => { state.showNodeParamsModal = false; }}
      />
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  return (
    <Dialog
      open={modalStore.myNodeInfo.show}
      onClose={() => {
        modalStore.myNodeInfo.close();
      }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <MyNodeInfo />
    </Dialog>
  );
});

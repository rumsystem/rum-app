import React from 'react';
import { ipcRenderer } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import copy from 'copy-to-clipboard';
import { app } from '@electron/remote';
import Tooltip from '@material-ui/core/Tooltip';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import MiddleTruncate from 'components/MiddleTruncate';

import { useStore } from 'store';

import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import formatPath from 'utils/formatPath';

import useCloseNode from 'hooks/useCloseNode';
import useResetNode from 'hooks/useResetNode';

import NetworkInfoModal from './NetworkInfoModal';
import NodeParamsModal from './NodeParamsModal';

const MyNodeInfo = observer(() => {
  const {
    nodeStore,
    snackbarStore,
    confirmDialogStore,
    modalStore,
  } = useStore();

  const state = useLocalObservable(() => ({
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
        if (!process.env.IS_ELECTRON) {
          return;
        }
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
              {nodeStore.apiConfig.origin}
            </div>
          </div>
        )}
        {process.env.IS_ELECTRON && (
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
        )}

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
              <div>{lang.version} {process.env.IS_ELECTRON ? app.getVersion() : ''}</div>
            </Tooltip>
            <div className="px-4">|</div>

            {process.env.IS_ELECTRON && (<>
              <div
                className="flex items-center hover:font-bold cursor-pointer"
                onClick={() => { state.showNodeParamsModal = true; }}
                data-test-id="node-and-network-node-params"
              >
                {lang.nodeParams}
              </div>
              <div className="px-4">|</div>
            </>)}

            <div
              className="flex items-center hover:font-bold cursor-pointer"
              onClick={() => { state.showNetworkInfoModal = true; }}
              data-test-id="node-and-network-network-status"
            >
              {lang.networkStatus}
            </div>
          </div>
        </div>
        {process.env.IS_ELECTRON && (
          <div className="mt-8">
            <Button fullWidth color="red" outline onClick={onExitNode}>
              {lang.exitNode}
            </Button>
          </div>
        )}
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
      className="node-info-modal"
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

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ipcRenderer, remote } from 'electron';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';
import StoragePathSettingModal from './StoragePathSettingModal';
import ModeSelectorModal from './ModeSelectorModal';
import { BOOTSTRAPS } from 'utils/constant';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';
import path from 'path';

export default observer(() => {
  const { groupStore, nodeStore, confirmDialogStore, snackbarStore } =
    useStore();
  const state = useLocalObservable(() => ({
    showStoragePathSettingModal: false,
    showModeSelectorModal: false,
    isStated: false,
    isStarting: false,
    isQuitting: false,
    loadingText: '正在启动节点',
  }));

  React.useEffect(() => {
    (async () => {
      if (!nodeStore.canUseExternalMode) {
        nodeStore.setMode('INTERNAL');
        tryStartNode();
      } else if (nodeStore.mode === 'EXTERNAL') {
        connectExternalNode(
          nodeStore.storeApiHost || nodeStore.apiHost,
          nodeStore.storePort
        );
      } else if (nodeStore.mode === 'INTERNAL') {
        tryStartNode();
      } else {
        state.showModeSelectorModal = true;
      }
    })();
    (window as any).Quorum = Quorum;

    async function connectExternalNode(apiHost: string, port: number) {
      nodeStore.setMode('EXTERNAL');
      nodeStore.setPort(port);
      const storagePath = path.join(__dirname, '../', 'quorum_data');
      await fs.ensureDir(storagePath);
      nodeStore.setStoragePath(storagePath);
      if (apiHost !== nodeStore.apiHost) {
        nodeStore.setApiHost(apiHost);
      }
      try {
        await ping();
        state.isStated = true;
      } catch (err) {
        console.error(err);
        confirmDialogStore.show({
          content: `开发节点无法访问，请检查一下<br />${apiHost}:${port}`,
          okText: '再次尝试',
          ok: () => {
            confirmDialogStore.hide();
            window.location.reload();
          },
          cancelText: '重置',
          cancel: async () => {
            snackbarStore.show({
              message: '重置成功',
            });
            await sleep(1500);
            groupStore.resetElectronStore();
            nodeStore.resetElectronStore();
            window.location.reload();
          },
        });
      }
    }

    async function tryStartNode() {
      if (nodeStore.storagePath) {
        const exists = await fs.pathExists(nodeStore.storagePath);
        if (!exists) {
          nodeStore.setStoragePath('');
        }
      }
      if (!nodeStore.storagePath) {
        state.showStoragePathSettingModal = true;
        return;
      }
      startNode(nodeStore.storagePath);
    }

    async function startNode(storagePath: string) {
      const { data: status } = await Quorum.up({
        host: BOOTSTRAPS[0].host,
        bootstrapId: BOOTSTRAPS[0].id,
        storagePath,
      });
      console.log('NODE_STATUS', status);
      nodeStore.setStatus(status);
      nodeStore.setPort(status.port);
      nodeStore.resetApiHost();
      state.isStarting = true;
      try {
        await ping(30);
      } catch (err) {
        console.error(err);
        confirmDialogStore.show({
          content: `群组没能正常启动，请再尝试一下`,
          okText: '重新启动',
          ok: () => {
            confirmDialogStore.hide();
            window.location.reload();
          },
          cancelText: '重置节点',
          cancel: async () => {
            confirmDialogStore.hide();
            await sleep(400);
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
          },
        });
        return;
      }
      state.isStarting = false;
      state.isStated = true;
      setupQuitHook();
    }

    async function ping(maxCount = 6) {
      let stop = false;
      let count = 0;
      while (!stop) {
        await sleep(1000);
        try {
          await GroupApi.fetchMyNodeInfo();
          stop = true;
          nodeStore.setConnected(true);
        } catch (err) {
          count++;
          if (count > maxCount) {
            stop = true;
            throw new Error('fail to connect group');
          }
        }
      }
    }

    function setupQuitHook() {
      ipcRenderer.send('renderer-quit-prompt');
      ipcRenderer.on('main-before-quit', async () => {
        const ownerGroupCount = groupStore.groups.filter(
          (group) => group.OwnerPubKey === nodeStore.info.node_publickey
        ).length;
        const res = await remote.dialog.showMessageBox({
          type: 'question',
          buttons: ['确定', '取消'],
          title: '退出节点',
          message: ownerGroupCount
            ? `你创建的 ${ownerGroupCount} 个群组需要你保持在线，维持出块。如果你的节点下线了，这些群组将不能发布新的内容，确定退出吗？`
            : '你的节点即将下线，确定退出吗？',
        });
        if (res.response === 1) {
          return;
        }
        ipcRenderer.send('renderer-will-quit');
        await sleep(500);
        if (nodeStore.status.up) {
          state.isQuitting = true;
          if (nodeStore.status.up) {
            await Quorum.down();
          }
        }
        ipcRenderer.send('renderer-quit');
      });
    }

    return () => {
      nodeStore.setConnected(false);
    };
  }, [nodeStore, state.showStoragePathSettingModal]);

  React.useEffect(() => {
    if (!state.isStarting) {
      return;
    }
    (async () => {
      await sleep(8000);
      state.loadingText = '连接成功，正在初始化，请稍候';
      await sleep(8000);
      state.loadingText = '即将完成';
      await sleep(8000);
      state.loadingText = '正在努力加载中';
    })();
  }, [state, state.isStarting]);

  if (!state.isStarting && !state.isStated) {
    return (
      <div>
        <StoragePathSettingModal
          force
          open={state.showStoragePathSettingModal}
          onClose={() => {
            state.showStoragePathSettingModal = false;
          }}
        />
        <ModeSelectorModal
          open={state.showModeSelectorModal}
          onClose={() => (state.showModeSelectorModal = false)}
        />
      </div>
    );
  }

  if (state.isQuitting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
          <div className="mt-6 text-15 text-gray-9b tracking-widest">
            节点正在退出
          </div>
        </div>
      </div>
    );
  }

  if (state.isStarting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-24 -ml-6">
          <Loading />
          <div className="mt-6 text-15 text-gray-9b tracking-widest">
            {state.loadingText}
          </div>
        </div>
      </div>
    );
  }

  if (state.isStated) {
    return <Bootstrap />;
  }

  return null;
});

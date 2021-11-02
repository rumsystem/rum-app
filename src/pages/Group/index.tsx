import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import PreFetch from './PreFetch';
import StoragePathSettingModal from './StoragePathSettingModal';
import ModeSelectorModal from './ModeSelectorModal';
import { BOOTSTRAPS } from 'utils/constant';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';
import path from 'path';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const {
    groupStore,
    nodeStore,
    confirmDialogStore,
    snackbarStore,
    modalStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    showStoragePathSettingModal: false,
    showModeSelectorModal: false,
    isStated: false,
    isStarting: false,
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
            nodeStore.setQuitting(true);
            modalStore.pageLoading.show();
            await sleep(400);
            await Quorum.down();
            await sleep(300);
            window.location.reload();
          },
        });
        return;
      }
      state.isStarting = false;
      state.isStated = true;
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

  if (state.isStarting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <Fade in={true} timeout={500}>
          <div className="-mt-24 -ml-6">
            <Loading />
            <div className="mt-6 text-15 text-gray-9b tracking-widest">
              {state.loadingText}
            </div>
          </div>
        </Fade>
      </div>
    );
  }

  if (state.isStated) {
    return <PreFetch />;
  }

  return null;
});

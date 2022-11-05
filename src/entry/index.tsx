import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import PreFetch from './PreFetch';
import { BOOTSTRAPS } from 'utils/constant';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';
import Fade from '@material-ui/core/Fade';
import setStoragePath from 'standaloneModals/setStoragePath';
import setExternalNodeSetting from 'standaloneModals/setExternalNodeSetting';
import useSetupToggleMode from 'hooks/useSetupToggleMode';
import useExitNode from 'hooks/useExitNode';

export default observer(() => {
  const {
    nodeStore,
    confirmDialogStore,
    snackbarStore,
    modalStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    isStated: false,
    isStarting: false,
    loadingText: '正在启动节点',
  }));
  const exitNode = useExitNode();

  useSetupToggleMode();

  const connect = async () => {
    if (nodeStore.storagePath) {
      const exists = await fs.pathExists(nodeStore.storagePath);
      if (!exists) {
        nodeStore.setStoragePath('');
      }
    }
    if (!nodeStore.storagePath) {
      await setStoragePath();
    }
    nodeStore.setConnected(false);
    if (nodeStore.mode === 'EXTERNAL') {
      if (!nodeStore.port) {
        await setExternalNodeSetting({ force: true });
        snackbarStore.show({
          message: '设置成功',
        });
        await sleep(1000);
        window.location.reload();
        return;
      }
      connectExternalNode(
        nodeStore.storeApiHost || nodeStore.apiHost,
        nodeStore.storePort,
        nodeStore.cert,
      );
    } else if (nodeStore.mode === 'INTERNAL') {
      startNode(nodeStore.storagePath);
    }

    async function connectExternalNode(apiHost: string, port: number, cert: string) {
      nodeStore.setPort(port);
      Quorum.setCert(cert);
      await fs.ensureDir(nodeStore.storagePath);
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
            nodeStore.resetElectronStore();
            nodeStore.setMode('EXTERNAL');
            window.location.reload();
          },
        });
      }
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
          content: '群组没能正常启动，请再尝试一下',
          okText: '重新启动',
          ok: () => {
            confirmDialogStore.hide();
            window.location.reload();
          },
          cancelText: '切换节点',
          cancel: async () => {
            confirmDialogStore.hide();
            modalStore.pageLoading.show();
            nodeStore.setStoragePath('');
            await sleep(400);
            await exitNode();
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
          count += 1;
          if (count > maxCount) {
            stop = true;
            throw new Error('fail to connect group');
          }
        }
      }
    }
  };

  React.useEffect(() => {
    connect();
  }, []);

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

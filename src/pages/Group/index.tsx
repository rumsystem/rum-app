import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';
import ModeSelectorModal from './ModeSelectorModal';
import { UpParam } from 'utils/quorum';
import { ipcRenderer } from 'electron';

export default observer(() => {
  const { groupStore, nodeStore, confirmDialogStore, snackbarStore } =
    useStore();
  const state = useLocalStore(() => ({
    bootstrapId: '',
    showModeSelectorModal: false,
    isStated: false,
    isStarting: false,
    loadingText: '正在启动群组',
    isQuitting: false,
  }));

  React.useEffect(() => {
    (async () => {
      if (!nodeStore.canUseExternalMode) {
        nodeStore.setMode('INTERNAL');
        startNode();
      } else if (nodeStore.mode === 'EXTERNAL') {
        connectExternalNode(nodeStore.getPortFromStorage());
      } else if (nodeStore.mode === 'INTERNAL') {
        startNode();
      } else {
        state.showModeSelectorModal = true;
      }
    })();
    (window as any).Quorum = Quorum;

    async function connectExternalNode(port: number) {
      nodeStore.setMode('EXTERNAL');
      nodeStore.setPort(port);
      try {
        await ping();
        state.isStated = true;
      } catch (err) {
        console.log(err.message);
        confirmDialogStore.show({
          content: `群组无法访问，请检查一下<br />（当前访问的群组端口是 ${nodeStore.port}）`,
          okText: '再次尝试',
          ok: () => {
            confirmDialogStore.hide();
            window.location.reload();
          },
          cancelText: '重置',
          cancel: async () => {
            snackbarStore.show({
              message: '即将重启',
            });
            await sleep(1500);
            nodeStore.resetPort();
            window.location.reload();
          },
        });
      }
    }

    async function startNode() {
      let res = await Quorum.up(nodeStore.config as UpParam);
      const status = {
        bootstrapId: res.data.bootstrapId,
        port: res.data.port,
        up: res.data.up,
        logs: '',
      };
      console.log(status);
      nodeStore.setStatus(status);
      state.isStarting = true;
      try {
        await ping(30);
      } catch (err) {
        console.log(err.message);
        confirmDialogStore.show({
          content: `群组没能正常启动，请再尝试一下`,
          okText: '重新启动',
          ok: () => {
            confirmDialogStore.hide();
            window.location.reload();
          },
          cancelText: '重置节点',
          cancel: () => {
            groupStore.reset();
            nodeStore.resetPort();
            nodeStore.resetPeerName();
            nodeStore.setMode('');
            Quorum.down();
            confirmDialogStore.hide();
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
  }, [nodeStore]);

  React.useEffect(() => {
    ipcRenderer.on('before-quit', async () => {
      if (nodeStore.status.up) {
        state.isQuitting = true;
        Quorum.down();
        await sleep(6000);
      }
      ipcRenderer.send('quit');
    });
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

  if (!state.isStarting && !state.isStated) {
    return (
      <ModeSelectorModal
        open={state.showModeSelectorModal}
        onClose={() => (state.showModeSelectorModal = false)}
      />
    );
  }

  if (state.isQuitting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
          <div className="mt-6 text-15 text-gray-9b tracking-widest">
            正在退出
          </div>
        </div>
      </div>
    );
  }

  if (state.isStarting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
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

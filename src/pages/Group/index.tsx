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
import { ipcRenderer, remote } from 'electron';

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
        connectExternalNode(
          nodeStore.getApiHostFromStorage() || nodeStore.apiHost,
          nodeStore.getPortFromStorage()
        );
      } else if (nodeStore.mode === 'INTERNAL') {
        startNode();
      } else {
        state.showModeSelectorModal = true;
      }
    })();
    (window as any).Quorum = Quorum;

    async function connectExternalNode(apiHost: string, port: number) {
      nodeStore.setMode('EXTERNAL');
      nodeStore.setPort(port);
      if (apiHost !== nodeStore.apiHost) {
        nodeStore.setApiHost(apiHost);
      }
      try {
        await ping();
        state.isStated = true;
      } catch (err) {
        console.log(err.message);
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
            nodeStore.setMode('');
            groupStore.reset();
            nodeStore.resetPort();
            nodeStore.resetApiHost();
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
      nodeStore.setPort(status.port);
      nodeStore.resetApiHost();
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
          cancel: async () => {
            confirmDialogStore.hide();
            await sleep(400);
            confirmDialogStore.show({
              content: '重置之后，所有群组和消息将全部丢失，请谨慎操作',
              okText: '确定重置',
              isDangerous: true,
              ok: async () => {
                groupStore.reset();
                nodeStore.resetPort();
                nodeStore.resetPeerName();
                nodeStore.setMode('');
                Quorum.down();
                confirmDialogStore.hide();
                window.location.reload();
              },
            });
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
      console.log(res.response);
      if (res.response === 1) {
        return;
      }
      ipcRenderer.send('renderer-will-quit');
      await sleep(500);
      if (nodeStore.status.up) {
        state.isQuitting = true;
        Quorum.down();
        await sleep(6000);
      }
      ipcRenderer.send('renderer-quit');
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

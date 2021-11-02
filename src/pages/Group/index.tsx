import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';
import ModeSelectorModal from './ModeSelectorModal';
import { DEFAULT_BOOTSTRAP_ID } from 'utils/constant';
import { UpParam } from 'utils/quorum';
import { remote } from 'electron';

export default observer(() => {
  const { groupStore, confirmDialogStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    bootstrapId: '',
    showModeSelectorModal: false,
    isStated: false,
    isStarting: false,
    loadingText: '正在启动群组',
  }));

  React.useEffect(() => {
    (async () => {
      if (!groupStore.canUseCustomPort) {
        groupStore.setBootstrapId(DEFAULT_BOOTSTRAP_ID);
        startNode();
      } else if (groupStore.isUsingCustomNodePort) {
        connectCustomNode();
      } else if (groupStore.bootstrapId) {
        startNode();
      } else {
        state.showModeSelectorModal = true;
      }
    })();
    (window as any).Quorum = Quorum;

    async function connectCustomNode() {
      try {
        await ping();
        state.isStated = true;
      } catch (err) {
        console.log(err.message);
        confirmDialogStore.show({
          content: `群组无法访问，请检查一下<br />（当前访问的群组端口是 ${groupStore.nodePort}）`,
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
            groupStore.resetNodePort();
            window.location.reload();
          },
        });
      }
    }

    async function startNode() {
      let res = await Quorum.up(groupStore.nodeConfig as UpParam);
      const status = {
        bootstrapId: res.data.bootstrapId,
        port: res.data.port,
        up: res.data.up,
        logs: '',
      };
      console.log(status);
      groupStore.setNodeStatus(status);
      try {
        state.isStarting = true;
        await ping(50);
      } catch (err) {
        state.isStarting = false;
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
            groupStore.shutdownNode();
            Quorum.down();
            confirmDialogStore.hide();
            window.location.reload();
          },
        });
        return;
      }
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
          groupStore.setNodeConnected(true);
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
      groupStore.setNodeConnected(false);
    };
  }, [groupStore, groupStore.bootstrapId]);

  React.useEffect(() => {
    remote.app.on('before-quit', () => {
      if (groupStore.nodeStatus.up) {
        Quorum.down();
      }
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

import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { UpParam } from 'utils/quorum';
import { remote } from 'electron';

export default observer(() => {
  const { groupStore, confirmDialogStore } = useStore();
  const state = useLocalStore(() => ({
    bootstrapId: '',
    showBootstrapIdModal: false,
    isFetched: false,
  }));

  React.useEffect(() => {
    if (!groupStore.bootstrapId) {
      state.showBootstrapIdModal = true;
      return;
    }

    (async () => {
      let res = await Quorum.up(groupStore.nodeConfig as UpParam);
      const status = {
        bootstrapId: res.data.bootstrapId,
        port: res.data.port,
        up: res.data.up,
        logs: '',
      };
      console.log(status);
      groupStore.setNodeStatus(status);
      if (!groupStore.nodeConnected) {
        let stop = false;
        let count = 0;
        while (!stop) {
          await sleep(1500);
          try {
            await GroupApi.fetchMyNodeInfo();
            stop = true;
            groupStore.setNodeConnected(true);
          } catch (err) {
            console.log(err.message);
            count++;
            if (count > 5) {
              stop = true;
            }
          }
        }
      }
      if (!groupStore.nodeConnected) {
        await sleep(500);
        if (groupStore.isNodeUsingCustomPort) {
          confirmDialogStore.show({
            content: `圈子没能正常启动，请再尝试一下（当前连接圈子的端口是 ${groupStore.nodePort}）`,
            okText: '重新启动',
            ok: () => {
              groupStore.resetNodePort();
              confirmDialogStore.hide();
              window.location.reload();
            },
          });
          return;
        } else {
          confirmDialogStore.show({
            content: `圈子没能正常启动，请再尝试一下`,
            okText: '重新启动',
            ok: () => {
              groupStore.shutdownNode();
              Quorum.down();
              confirmDialogStore.hide();
              window.location.reload();
            },
          });
        }
        return;
      }
      state.isFetched = true;
      remote.app.on('before-quit', () => {
        groupStore.shutdownNode();
      });
    })();
    (window as any).Quorum = Quorum;

    return () => {
      groupStore.setNodeConnected(false);
    };
  }, [groupStore, groupStore.bootstrapId]);

  const setBootstrapId = () => {
    groupStore.setBootstrapId(state.bootstrapId);
    state.showBootstrapIdModal = false;
  };

  if (state.showBootstrapIdModal) {
    return (
      <Dialog
        disableBackdropClick={false}
        open={true}
        onClose={() => (state.showBootstrapIdModal = false)}
        transitionDuration={{
          enter: 300,
        }}
      >
        <div className="bg-white rounded-12 text-center py-8 px-12">
          <div className="w-50">
            <div className="text-18 font-bold text-gray-700">填写入口节点</div>
            <div className="pt-3">
              <TextField
                className="w-full"
                placeholder="请输入 Bootstrap ID"
                size="small"
                value={state.bootstrapId}
                autoFocus
                onChange={(e) => {
                  state.bootstrapId = e.target.value.trim();
                }}
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) {
                    e.preventDefault();
                    e.target.blur();
                    setBootstrapId();
                  }
                }}
                margin="dense"
                variant="outlined"
              />
            </div>
            <div className="mt-6" onClick={setBootstrapId}>
              <Button fullWidth>确定</Button>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  if (!state.isFetched) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
        </div>
      </div>
    );
  }

  return <Bootstrap />;
});

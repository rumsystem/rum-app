import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import useDatabase from 'hooks/useDatabase';

interface IProps {
  open: boolean
  onClose: () => void
}

const GroupEditor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore, groupStore, seedStore, nodeStore, latestStatusStore } = useStore();
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    name: '',
    loading: false,
    done: false,
  }));

  const createGroup = async () => {
    if (!state.name) {
      snackbarStore.show({
        message: '请输入群组名称',
        type: 'error',
      });
      return;
    }
    if (!state.name || state.name.length < 5) {
      snackbarStore.show({
        message: '名称至少要输入5个字哦',
        type: 'error',
      });
      return;
    }
    state.loading = true;
    state.done = false;
    try {
      const group = await GroupApi.createGroup(state.name);
      await sleep(200);
      const { groups } = await GroupApi.fetchMyGroups();
      if (groups) {
        state.loading = false;
        state.done = true;
        await sleep(300);
        seedStore.addSeed(nodeStore.storagePath, group.group_id, group);
        groupStore.addGroups(groups);
        latestStatusStore.updateMap(database, group.group_id, {
          latestTimeStamp: Date.now() * 1000000,
        });
        activeGroupStore.setId(group.group_id);
        props.onClose();
        await sleep(200);
        snackbarStore.show({
          message: '创建成功',
        });
      }
    } catch (err) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: '创建失败，貌似哪里出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-50">
        <div className="text-18 font-bold text-gray-700">创建群组</div>
        <div className="pt-3">
          <TextField
            className="w-full"
            placeholder="群组名称"
            size="small"
            value={state.name}
            autoFocus
            onChange={(e) => {
              state.name = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                createGroup();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-5" onClick={createGroup}>
          <Button fullWidth isDoing={state.loading} isDone={state.done}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <GroupEditor {...props} />
  </Dialog>
));

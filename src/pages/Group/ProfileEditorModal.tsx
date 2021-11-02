import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { sleep } from 'utils';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import ImageEditor from 'components/ImageEditor';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ProfileEditor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore, groupStore, seedStore, nodeStore } =
    useStore();
  const state = useLocalObservable(() => ({
    name: '',
    loading: false,
    done: false,
    avatar: 'https://i.xue.cn/b3be63.jpg',
  }));

  const updateProfile = async () => {
    if (!state.name) {
      snackbarStore.show({
        message: '请输入昵称',
        type: 'error',
      });
      return;
    }
    state.loading = true;
    state.done = false;
    console.log(` ------------- 更新 profile ---------------`);
    console.log({ name: state.name, avatar: state.avatar });
    // try {
    //   const group = await GroupApi.updateProfile(state.name);
    //   await sleep(200);
    //   const { groups } = await GroupApi.fetchMyGroups();
    //   if (groups) {
    //     state.loading = false;
    //     state.done = true;
    //     await sleep(300);
    //     seedStore.addSeed(nodeStore.storagePath, group.group_id, group);
    //     groupStore.addGroups(groups);
    //     activeGroupStore.setId(group.group_id);
    //     props.onClose();
    //     await sleep(200);
    //     snackbarStore.show({
    //       message: '创建成功',
    //     });
    //   }
    // } catch (err) {
    //   console.error(err);
    //   state.loading = false;
    //   snackbarStore.show({
    //     message: '创建失败，貌似哪里出错了',
    //     type: 'error',
    //   });
    // }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-72">
        <div className="text-18 font-bold text-gray-700">编辑资料</div>
        <div className="mt-6">
          <div className="flex justify-center">
            <ImageEditor
              roundedFull
              width={200}
              placeholderWidth={120}
              editorPlaceholderWidth={200}
              name="头像"
              imageUrl={state.avatar}
              getImageUrl={(url: string) => {
                state.avatar = url;
              }}
            />
          </div>
          <TextField
            className="w-full px-12 mt-6"
            placeholder="昵称"
            size="small"
            value={state.name}
            onChange={(e) => {
              state.name = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                updateProfile();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6 pt-2" onClick={updateProfile}>
          <Button fullWidth isDoing={state.loading} isDone={state.done}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      disableBackdropClick={false}
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ProfileEditor {...props} />
    </Dialog>
  );
});

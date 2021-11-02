import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField, Checkbox } from '@material-ui/core';
import Button from 'components/Button';
import { sleep } from 'utils';
import { useStore } from 'store';
import ImageEditor from 'components/ImageEditor';
import Tooltip from '@material-ui/core/Tooltip';
import useSubmitPerson from 'hooks/useSubmitPerson';

interface IProps {
  open: boolean
  onClose: () => void
}

const ProfileEditor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore, nodeStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    applyToAllGroups: false,
    profile: activeGroupStore.profile,
  }));
  const submitPerson = useSubmitPerson();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: '请输入昵称',
        type: 'error',
      });
      return;
    }
    state.loading = true;
    state.done = false;
    try {
      const groupIds = state.applyToAllGroups
        ? groupStore.groups.map((group) => group.GroupId)
        : [activeGroupStore.id];
      for (const groupId of groupIds) {
        const profile = await submitPerson({
          groupId,
          publisher: nodeStore.info.node_publickey,
          profile: state.profile,
        });
        if (activeGroupStore.id === groupId) {
          activeGroupStore.setProfile(profile);
          groupStore.setProfileAppliedToAllGroups(state.profile);
        }
      }
      await sleep(400);
      state.loading = false;
      state.done = true;
      props.onClose();
      await sleep(200);
      snackbarStore.show({
        message: '修改成功',
      });
    } catch (err) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: '修改失败，貌似哪里出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-72">
        <div className="text-18 font-bold text-gray-700">编辑资料</div>
        <div className="mt-5">
          <div className="flex justify-center">
            <ImageEditor
              roundedFull
              width={200}
              placeholderWidth={120}
              editorPlaceholderWidth={200}
              imageUrl={state.profile.avatar}
              getImageUrl={(url: string) => {
                state.profile.avatar = url;
              }}
            />
          </div>
          <TextField
            className="w-full px-12 mt-6"
            placeholder="昵称"
            size="small"
            value={state.profile.name}
            onChange={(e) => {
              state.profile.name = e.target.value.trim();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
                updateProfile();
              }
            }}
            margin="dense"
            variant="outlined"
          />
          <Tooltip
            enterDelay={600}
            enterNextDelay={600}
            placement="top"
            title="所有群组都使用这个昵称和头像"
            arrow
          >
            <div
              className="flex items-center justify-center mt-5 -ml-2"
              onClick={() => {
                state.applyToAllGroups = !state.applyToAllGroups;
              }}
            >
              <Checkbox checked={state.applyToAllGroups} color="primary" />
              <span className="text-gray-88 text-13 cursor-pointer">
                应用到所有群组
              </span>
            </div>
          </Tooltip>
        </div>

        <div className="mt-2" onClick={updateProfile}>
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
    <ProfileEditor {...props} />
  </Dialog>
));

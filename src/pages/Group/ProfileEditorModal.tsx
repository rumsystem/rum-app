import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { sleep } from 'utils';
import { useStore } from 'store';
import GroupApi, { ContentTypeUrl } from 'apis/group';
import ImageEditor from 'components/ImageEditor';
import Base64 from 'utils/base64';
import getProfile from 'store/selectors/getProfile';
import Database, { ContentStatus } from 'store/database';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ProfileEditor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore, nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    profile: getProfile(nodeStore.info.node_publickey, activeGroupStore.person),
  }));

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
      const payload = {
        type: 'Update',
        person: {
          name: state.profile.name,
          image: {
            mediaType: Base64.getMimeType(state.profile.avatar),
            content: Base64.getContent(state.profile.avatar),
          },
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.updateProfile(payload);
      const person = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_publickey,
        Content: payload.person,
        TypeUrl: ContentTypeUrl.Person,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.Syncing,
      };
      await new Database().persons.add(person);
      activeGroupStore.setPerson(person);
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
        <div className="mt-6">
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

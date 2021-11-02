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
// import useAvatar from 'hooks/useAvatar';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ProfileEditor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore, nodeStore, profileStore } =
    useStore();
  // const defaultAvatar = useAvatar(nodeStore.info.node_publickey);
  const defaultAvatar = '';
  const profile = profileStore.profileMap[nodeStore.info.node_publickey];
  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    name: profile
      ? profile.Content.name
      : nodeStore.info.node_publickey.slice(-10, -2),
    avatar:
      profile && profile.Content.image
        ? Base64.getUrl(profile.Content.image)
        : '',
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
    try {
      const payload = {
        type: 'Update',
        person: {
          name: state.name,
          image: {
            mediaType: Base64.getMimeType(state.avatar),
            content: Base64.getContent(state.avatar),
          },
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.updateProfile(payload);
      profileStore.addProfiles([
        {
          TrxId: res.trx_id,
          Publisher: nodeStore.info.node_publickey,
          Content: {
            name: payload.person.name,
            image: payload.person.image,
          },
          TypeUrl: ContentTypeUrl.Person,
          TimeStamp: Date.now() * 1000000,
        },
      ]);
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
              name="头像"
              imageUrl={state.avatar || defaultAvatar}
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

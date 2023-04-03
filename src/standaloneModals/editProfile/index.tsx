import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { toJS } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import ImageEditor from 'components/ImageEditor';
import useSubmitProfile from 'hooks/useSubmitProfile';
import useDatabase from 'hooks/useDatabase';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import { lang } from 'utils/lang';
import { isEqual } from 'lodash';
import base64 from 'utils/base64';

interface EditProfileProps {
  groupIds?: string[]
  profile?: ProfileModel.IDBProfile
}

interface NewProfileData {
  name: string
  avatar?: ProfileModel.IDBProfile['avatar']
  mixinUID?: string
}

export default async (props: EditProfileProps) => new Promise<NewProfileData | undefined>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <EditProfileModel
            {...props}
            rs={(profile) => {
              rs(profile);
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface EditProfileModelProps extends EditProfileProps {
  rs: (v?: NewProfileData) => unknown
}
const EditProfileModel = observer((props: EditProfileModelProps) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const close = () => {
    state.open = false;
    props.rs();
  };
  return (
    <Dialog
      open={state.open}
      onClose={close}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ProfileEditor onClose={close} {...props} />
    </Dialog>
  );
});

interface ProfileEditorProps extends EditProfileModelProps {
  onClose?: () => unknown
}

const ProfileEditor = observer((props: ProfileEditorProps) => {
  const database = useDatabase();
  const { snackbarStore, groupStore } = useStore();

  const {
    groupIds,
    profile,
  } = props;

  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    profile: {
      name: profile?.name ?? '',
      avatar: profile?.avatar,
      mixinUID: profile?.wallet?.find((v) => v.type === 'mixin')?.id ?? '',
    } as NewProfileData,
  }));
  const submitProfile = useSubmitProfile();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: lang.require(lang.nickname),
        type: 'error',
      });
      return;
    }
    if (!state.profile.avatar) {
      snackbarStore.show({
        message: lang.requireAvatar,
        type: 'error',
      });
      return;
    }
    await sleep(400);
    const profile = toJS(state.profile);
    // if (profile.avatar.startsWith('file://')) {
    //   const base64 = await fs.readFile(profile.avatar.replace('file://', ''), { encoding: 'base64' });
    //   profile.avatar = `data:image/png;base64,${base64}`;
    // }
    state.loading = true;
    state.done = false;
    try {
      if (!groupIds || groupIds.length === 0) {
        props.rs(profile);
      } else {
        for (const groupId of groupIds) {
          const latestProfile = await ProfileModel.get(database, {
            groupId,
            publisher: groupStore.map[groupId].user_pubkey,
          });
          if (
            latestProfile
            && latestProfile.name === profile.name
            && isEqual(latestProfile.avatar, profile.avatar)
          ) {
            continue;
          } else {
            profile.mixinUID = latestProfile?.wallet?.find((v) => v.type === 'mixin')?.id;
          }
          await submitProfile({
            groupId,
            publisher: groupStore.map[groupId].user_pubkey,
            name: state.profile.name,
            avatar: toJS(state.profile.avatar),
            wallet: state.profile.mixinUID
              ? [{ id: state.profile.mixinUID, name: 'mixin', type: 'mixin' }]
              : undefined,
          });
        }
      }
      state.loading = false;
      state.done = true;
      await sleep(300);
      props.onClose?.();
    } catch (err: any) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: err.message || lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div className="w-100 bg-white rounded-lg text-center pb-8 pt-12 px-12">
      <div>
        <div className="text-16 font-bold text-gray-4a">{lang.editProfile}</div>
        <div className="mt-6">
          <div className="flex border border-gray-200 px-6 py-8 rounded-0">
            <div className="flex justify-center mr-5 pb-2">
              <ImageEditor
                roundedFull
                width={200}
                placeholderWidth={90}
                editorPlaceholderWidth={200}
                showAvatarSelect
                avatarMaker
                imageUrl={state.profile.avatar ? base64.getUrl(state.profile.avatar) : ''}
                getImageUrl={(url: string) => {
                  state.profile.avatar = {
                    mediaType: base64.getMimeType(url),
                    content: base64.getContent(url),
                  };
                }}
              />
            </div>
            <div className="flex items-center">
              <TextField
                className="w-full opacity-80"
                label={lang.nickname}
                size="small"
                value={state.profile.name}
                onChange={(e) => {
                  state.profile.name = e.target.value.trim().slice(0, 40);
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

            </div>
          </div>
        </div>

        <div className="mt-10" onClick={updateProfile}>
          <Button
            className="rounded w-[160px] h-10"
            isDoing={state.loading}
            isDone={state.done}
          >
            {lang.yes}
          </Button>
        </div>
      </div>
    </div>
  );
});

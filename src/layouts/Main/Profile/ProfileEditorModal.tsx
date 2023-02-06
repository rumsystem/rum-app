import React from 'react';
import { toJS } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import ImageEditor from 'components/ImageEditor';
import useSubmitProfile from 'hooks/useSubmitProfile';
import { isEqual } from 'lodash';
import useDatabase from 'hooks/useDatabase';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import fs from 'fs-extra';
import base64 from 'utils/base64';

interface IProps {
  open: boolean
  onClose: () => void
}

const ProfileEditor = observer((props: IProps) => {
  const database = useDatabase();
  const { snackbarStore, activeGroupStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => {
    const profile = toJS(activeGroupStore.profile);
    return {
      loading: false,
      done: false,
      profile,
      imgUrl: profile.avatar ? base64.getUrl(profile.avatar) : '',
    };
  });
  const submitProfile = useSubmitProfile();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: lang.require(lang.nickname),
        type: 'error',
      });
      return;
    }
    await sleep(400);
    const currentGroupId = activeGroupStore.id;
    const profile = toJS(state.profile);
    const imgUrl = state.imgUrl;
    if (imgUrl.startsWith('file://')) {
      const base64 = await fs.readFile(imgUrl.replace('file://', ''), { encoding: 'base64' });
      profile.avatar = {
        mediaType: 'image/png',
        content: base64,
      };
    } else if (imgUrl) {
      try {
        profile.avatar = {
          mediaType: base64.getMimeType(imgUrl),
          content: base64.getContent(imgUrl),
        };
      } catch (e) {}
    }
    state.loading = true;
    state.done = false;
    try {
      const groupIds = [currentGroupId];
      for (const groupId of groupIds) {
        const latestProfile = await ProfileModel.get(database, {
          groupId,
          publisher: activeGroup.user_pubkey,
          raw: true,
        });
        const notChanged = latestProfile
          && latestProfile.name === profile.name
          && isEqual(latestProfile.avatar, profile.avatar);
        if (notChanged) {
          continue;
        }
        await submitProfile(profile);
      }
      state.loading = false;
      state.done = true;
      await sleep(300);
      props.onClose();
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
    <div className="w-100 bg-white rounded-0 text-center pb-8 pt-12 px-12">
      <div>
        <div className="text-16 font-bold text-gray-4a">{lang.editProfile}</div>
        <div className="mt-6">
          <div className="flex border border-gray-200 px-6 py-6 rounded-0">
            <div className="flex justify-center mr-5 pb-2">
              <ImageEditor
                roundedFull
                width={200}
                placeholderWidth={90}
                editorPlaceholderWidth={200}
                showAvatarSelect
                avatarMaker
                imageUrl={state.imgUrl}
                getImageUrl={(url: string) => {
                  state.imgUrl = url;
                }}
              />
            </div>
            <div className="pt-2">
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
                data-test-id="profile-name-input"
              />

            </div>
          </div>
        </div>

        <div className="mt-10" onClick={updateProfile}>
          <Button
            className="rounded w-[160px] h-10"
            isDoing={state.loading}
            isDone={state.done}
            data-test-id="profile-edit-confirm"
          >
            {lang.yes}
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

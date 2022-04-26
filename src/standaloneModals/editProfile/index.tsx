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
import useSubmitPerson from 'hooks/useSubmitPerson';
import useDatabase from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { lang } from 'utils/lang';
import fs from 'fs-extra';

export default async (props: { groupIds: string[], profile?: any }) => new Promise<void>((rs) => {
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
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

const EditProfileModel = observer((props: any) => {
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

const ProfileEditor = observer((props: any) => {
  const database = useDatabase();
  const { snackbarStore, groupStore } = useStore();

  const {
    groupIds,
    profile,
  } = props;

  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    profile: profile ? { name: profile.name, avatar: profile.avatar } : { name: '', avatar: '' },
  }));
  const submitPerson = useSubmitPerson();

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
    const profile = toJS(state.profile) as { name: string, avatar: string, mixinUID?: string };
    if (profile.avatar.startsWith('file://')) {
      const base64 = await fs.readFile(profile.avatar.replace('file://', ''), { encoding: 'base64' });
      profile.avatar = `data:image/png;base64,${base64}`;
    }
    state.loading = true;
    state.done = false;
    try {
      for (const groupId of groupIds) {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: groupStore.map[groupId].user_pubkey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && latestPerson.profile.name === profile.name
          && latestPerson.profile.avatar === profile.avatar
        ) {
          continue;
        } else {
          profile.mixinUID = latestPerson.profile.mixinUID;
        }
        await submitPerson({
          groupId,
          publisher: groupStore.map[groupId].user_pubkey,
          profile,
        });
      }
      state.loading = false;
      state.done = true;
      await sleep(300);
      props.onClose();
    } catch (err) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg text-center py-8 px-12">
      <div className="w-78">
        <div className="text-18 font-bold text-gray-700">{lang.editProfile}</div>
        <div className="mt-6">
          <div className="flex border border-gray-200 px-6 py-8 rounded-0">
            <div className="flex justify-center mr-5 pb-2">
              <ImageEditor
                roundedFull
                width={200}
                placeholderWidth={90}
                editorPlaceholderWidth={200}
                showAvatarSelect
                imageUrl={state.profile.avatar}
                getImageUrl={(url: string) => {
                  state.profile.avatar = url;
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
          <Button className="w-36" isDoing={state.loading} isDone={state.done}>
            {lang.yes}
          </Button>
        </div>
      </div>
    </div>
  );
});

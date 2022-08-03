import React from 'react';
import { toJS } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import ImageEditor from 'components/ImageEditor';
import useSubmitPerson from 'hooks/useSubmitPerson';
import { isEqual } from 'lodash';
import useDatabase from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import fs from 'fs-extra';

interface IProps {
  open: boolean
  onClose: () => void
}

const ProfileEditor = observer((props: IProps) => {
  const database = useDatabase();
  const { snackbarStore, activeGroupStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    loading: false,
    done: false,
    profile: toJS(activeGroupStore.profile),
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
    await sleep(400);
    const currentGroupId = activeGroupStore.id;
    const profile = toJS(state.profile);
    if (profile.avatar.startsWith('file://')) {
      const base64 = await fs.readFile(profile.avatar.replace('file://', ''), { encoding: 'base64' });
      profile.avatar = `data:image/png;base64,${base64}`;
    }
    state.loading = true;
    state.done = false;
    try {
      const groupIds = [currentGroupId];
      for (const groupId of groupIds) {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: activeGroup.user_pubkey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && isEqual(latestPerson.profile, profile)
        ) {
          continue;
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
                imageUrl={state.profile.avatar}
                getImageUrl={(url: string) => {
                  state.profile.avatar = url;
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

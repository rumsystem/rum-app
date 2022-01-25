import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import sleep from 'utils/sleep';
import ProfileSelector from 'components/profileSelector';
import useSubmitPerson from 'hooks/useSubmitPerson';

const groupProfile = (groups: any) => {
  const profileMap: any = {};
  groups.forEach((group: any) => {
    if (group.profileTag) {
      if (group.profileTag in profileMap) {
        profileMap[group.profileTag].count += 1;
      } else {
        profileMap[group.profileTag] = {
          profileTag: group.profileTag,
          profile: group.profile,
          count: 1,
        };
      }
    }
  });
  return Object.values(profileMap).sort((a: any, b: any) => b.count - a.count);
};

export const initProfile = async (groudId: string) => new Promise<void>((rs) => {
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
          <InitProfile
            groudId={groudId}
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


interface Props {
  groudId: string
  rs: () => unknown
}

const InitProfile = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    filterProfile: [] as any,
    allProfile: [] as any,
    profile: null as any,
    loading: false,

    originalDesc: '',
    originalIcon: '',

    name: '',
    icon: '',
    desc: '',
  }));

  const { groupStore, snackbarStore } = useStore();
  const group = groupStore.map[props.groudId];

  const submitPerson = useSubmitPerson();

  const handleSave = async () => {
    const groupId = props.groudId;
    runInAction(() => {
      state.loading = true;
    });

    try {
      // it take several second to sync
      await sleep(400);
      await submitPerson({
        groupId,
        publisher: groupStore.map[groupId].user_pubkey,
        profile: state.profile,
      });
      snackbarStore.show({
        message: lang.savedAndWaitForSyncing,
        duration: 3000,
      });
    } catch (e) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    runInAction(() => {
      state.loading = false;
    });
    handleClose();
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  React.useEffect(action(() => {
    if (!group) {
      handleClose();
      return;
    }
    const profiles = groupProfile(groupStore.groups);
    state.allProfile = profiles;
    state.filterProfile = profiles.map((profile: any) => profile.profileTag);
  }), [groupStore.groups]);

  return (<Dialog
    open={state.open}
    onClose={handleClose}
    transitionDuration={{
      enter: 300,
    }}
  >
    <div className="bg-white rounded-lg p-6 w-[400px]">
      <div className="pt-4 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-6">
          {lang.initProfileTitle} {group.group_name}
        </div>

        <div className="flex flex-center text-14 text-gray-9c">
          {lang.selectProfile}
        </div>

        <div className="mt-5 flex items-center justify-center">
          <ProfileSelector
            className="bg-gray-f2"
            profiles={state.allProfile}
            selected={group.profileTag}
            status={group.profileStatus}
            onSelect={(profile) => { state.profile = profile; }}
          />
        </div>

        <div className="flex flex-col flex-center mt-8 text-16">
          <Button
            className='w-36 h-9'
            isDoing={state.loading}
            onClick={handleSave}
            disabled={!state.profile}
          >
            <span className="text-16">
              {lang.save}
            </span>
          </Button>

          <span
            className="mt-5 text-link-blue cursor-pointer text-14"
            onClick={handleClose}
          >
            {lang.manageGroupSkip}
          </span>
        </div>
      </div>
    </div>
  </Dialog>);
});

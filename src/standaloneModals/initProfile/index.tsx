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
import MixinUIDSelector from 'components/mixinUIDSelector';
import useSubmitPerson from 'hooks/useSubmitPerson';

const groupProfile = (groups: any) => {
  const profileMap: any = {};
  const mixinUIDMap: any = {};
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
    if (group?.profile?.mixinUID) {
      if (group.profile.mixinUID in mixinUIDMap) {
        mixinUIDMap[group.profile.mixinUID].count += 1;
      } else {
        mixinUIDMap[group.profile.mixinUID] = {
          mixinUID: group.profile.mixinUID,
          profile: group.profile,
          count: 1,
        };
      }
    }
  });
  return [
    Object.values(profileMap).sort((a: any, b: any) => b.count - a.count),
    Object.values(mixinUIDMap).sort((a: any, b: any) => b.count - a.count),
  ];
};

export const initProfile = async (groupId: string) => new Promise<void>((rs) => {
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
            groupId={groupId}
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
  groupId: string
  rs: () => unknown
}

const InitProfile = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    step: 1,
    allProfile: [] as any,
    allMixinUID: [] as any,
    profile: null as any,
    loading: false,
  }));

  const { groupId } = props;

  const { groupStore, snackbarStore } = useStore();
  const group = groupStore.map[props.groupId];

  const submitPerson = useSubmitPerson();

  const handleSave = async () => {
    if (state.step === 1) {
      state.step = 2;
      return;
    }
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
      }, {
        ignoreGroupStatus: true,
      });
      snackbarStore.show({
        message: lang.savedAndWaitForSyncing,
        duration: 3000,
      });
    } catch (err: any) {
      snackbarStore.show({
        message: err.message || lang.somethingWrong,
        type: 'error',
      });
    }
    runInAction(() => {
      state.loading = false;
    });
    handleClose();
  };

  const handleSkip = async () => {
    try {
      if (state.step === 1) {
        state.profile = null;
        state.step = 2;
        return;
      }
      runInAction(() => {
        state.loading = true;
      });
      // it take several second to sync
      if (state.profile) {
        await sleep(400);
        await submitPerson({
          groupId,
          publisher: groupStore.map[groupId].user_pubkey,
          profile: { name: state.profile.name, avatar: state.profile.avatar },
        }, {
          ignoreGroupStatus: true,
        });
      }
    } catch (err: any) {
      snackbarStore.show({
        message: err.message || lang.somethingWrong,
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
    const [profiles, mixinUIDs] = groupProfile(groupStore.topGroups);
    state.allProfile = profiles;
    state.allMixinUID = mixinUIDs;
  }), [groupStore.topGroups]);

  return (<Dialog
    open={state.open}
    onClose={handleSkip}
    transitionDuration={{
      enter: 300,
    }}
  >
    <div className="bg-white rounded-lg p-6 w-[400px]">
      <div className="pt-4 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-6">
          {lang.initProfile}
        </div>

        <div className="flex flex-center text-14 text-gray-9c">
          { state.step === 1 && lang.selectProfile}
          { state.step === 2 && lang.selectMixinUID}
        </div>

        <div className="mt-5 flex items-center justify-center">
          {
            state.step === 1 && (
              <ProfileSelector
                type="init"
                className="bg-gray-f2"
                profiles={state.allProfile}
                onSelect={(profile) => { state.profile = { name: profile.name, avatar: profile.avatar }; }}
              />
            )
          }
          {
            state.step === 2 && (
              <MixinUIDSelector
                type="init"
                className="bg-gray-f2 w-[240px]"
                profiles={state.allMixinUID}
                onSelect={(mixinUID) => { state.profile = { ...state.profile, mixinUID }; }}
              />
            )
          }
        </div>

        <div className="flex flex-col flex-center mt-8 text-16">
          <Button
            className='w-36 h-9'
            isDoing={state.loading}
            onClick={handleSave}
            disabled={(state.step === 1 && !state.profile) || (state.step === 2 && !state.profile?.mixinUID)}
          >
            <span className="text-16">
              {lang.save}
            </span>
          </Button>

          <span
            className="mt-5 text-link-blue cursor-pointer text-14"
            onClick={handleSkip}
          >
            {lang.manageGroupSkip}
          </span>
        </div>
      </div>
    </div>
  </Dialog>);
});

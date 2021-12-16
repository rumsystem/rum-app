import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { toJS } from 'mobx';
import Button from 'components/Button';
import { useStore } from 'store';
import ProfileEditorModal from './ProfileEditorModal';
import useDatabase from 'hooks/useDatabase';
import { IDbSummary } from 'hooks/useDatabase/models/summary';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import ImageEditor from 'components/ImageEditor';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import getProfile from 'store/selectors/getProfile';
import { RiCheckLine } from 'react-icons/ri';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import { IUser } from 'hooks/useDatabase/models/person';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { GoMute } from 'react-icons/go';
import { HiOutlineBan } from 'react-icons/hi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';
import useSubmitPerson from 'hooks/useSubmitPerson';
import DeniedListApi from 'apis/deniedList';
import sleep from 'utils/sleep';
import { assetsBasePath } from 'utils/env';
import { GroupStatus } from 'apis/group';
import fs from 'fs-extra';
import { isEqual } from 'lodash';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';

interface IProps {
  publisher: string
}

export default observer((props: IProps) => {
  const { activeGroupStore, snackbarStore, authStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const groupStatusCheck = useGroupStatusCheck();
  const submitPerson = useSubmitPerson();
  const publisher = props.publisher;
  const isMySelf = activeGroup.user_pubkey === publisher;
  const state = useLocalObservable(() => ({
    showProfileEditorModal: false,
    loading: false,
    user: {
      profile: getProfile(activeGroup.user_pubkey),
      objectCount: 0,
    } as IUser,
    summary: null as IDbSummary | null,
    applyToAllGroups: false,
  }));
  const isSyncing = activeGroupStore.latestPersonStatus === ContentStatus.syncing;
  const isGroupOwner = activeGroup.user_pubkey === activeGroup.owner_pubkey;

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      const db = database;
      const user = await PersonModel.getUser(db, {
        GroupId: activeGroupStore.id,
        Publisher: publisher,
        withObjectCount: true,
      });
      state.user = user;
      state.loading = false;
    })();
  }, [state, publisher, activeGroup.user_pubkey, activeGroupStore.profile]);

  const follow = async (publisher: string) => {
    try {
      await activeGroupStore.follow(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const unFollow = async (publisher: string) => {
    try {
      await activeGroupStore.unFollow(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const block = async (publisher: string) => {
    try {
      await activeGroupStore.block(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const allow = async (publisher: string) => {
    try {
      await activeGroupStore.allow(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const ban = async (publisher: string) => {
    try {
      await DeniedListApi.submitDeniedList({
        peer_id: publisher,
        group_id: activeGroup.group_id,
        action: 'add',
      });
      await sleep(200);
      snackbarStore.show({
        message: lang.submittedWaitForSync,
        duration: 2500,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const unBan = async (publisher: string) => {
    try {
      await DeniedListApi.submitDeniedList({
        peer_id: publisher,
        group_id: activeGroup.group_id,
        action: 'del',
      });
      await sleep(200);
      snackbarStore.show({
        message: lang.submittedWaitForSync,
        duration: 2500,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const updateProfile = async (profile: any) => {
    if (!profile.name) {
      snackbarStore.show({
        message: lang.require(lang.nickname),
        type: 'error',
      });
      return;
    }
    await sleep(400);
    const currentGroupId = activeGroupStore.id;
    const canPost = groupStatusCheck(currentGroupId, true, {
      [GroupStatus.SYNCING]: lang.waitForSyncingDoneToSubmitProfile,
      [GroupStatus.SYNC_FAILED]: lang.syncFailedTipForProfile,
    });
    if (!canPost) {
      return;
    }
    if (profile.avatar.startsWith('file://')) {
      const base64 = await fs.readFile(profile.avatar.replace('file://', ''), { encoding: 'base64' });
      profile.avatar = `data:image/png;base64,${base64}`;
    }
    try {
      const groupIds = state.applyToAllGroups
        ? groupStore.groups.map((group) => group.group_id)
        : [currentGroupId];
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
      if (state.applyToAllGroups) {
        await globalProfileModel.createOrUpdate(offChainDatabase, {
          name: profile.name,
          avatar: profile.avatar,
          mixinUID: profile.mixinUID,
        });
      }
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div
      className="relative overflow-hidden profile rounded-0 bg-white border border-gray-88 mb-3"
    >
      <div className="flex justify-between items-stretch text-black">
        <div className="flex items-end py-[18px] pl-10">
          {!isMySelf && (
            <Avatar
              className={classNames(
                {
                  invisible: state.loading,
                },
                'bg-white ml-1',
              )}
              loading={isSyncing}
              url={state.user.profile.avatar}
              size={74}
            />
          )}
          {isMySelf && (
            <ImageEditor
              loading={state.loading}
              isSyncing={isSyncing}
              roundedFull
              width={200}
              placeholderWidth={74}
              editorPlaceholderWidth={200}
              imageUrl={state.user.profile.avatar}
              getImageUrl={(url: string) => {
                const profile = toJS(state.user.profile);
                updateProfile({ ...profile, avatar: url });
              }}
            />
          )}
          <div className="ml-5">
            <div
              className={classNames(
                {
                  invisible: state.loading,
                },
                'font-bold text-18 leading-none text-gray-4a',
              )}
            >
              {state.user.profile.name}
            </div>
            <div className="mt-10-px text-14 text-gray-9b pb-1 font-bold tracking-wide">
              {lang.contentCount(state.user.objectCount)}
            </div>
          </div>
        </div>
        {isMySelf && (
          <div className={classNames({
            'mt-4': isSyncing,
          }, 'mr-10 flex items-center')}
          >
            <div>
              <Button
                outline
                className="opacity-60"
                onClick={() => {
                  state.showProfileEditorModal = true;
                }}
              >
                {lang.editProfile}
              </Button>
              <ProfileEditorModal
                open={state.showProfileEditorModal}
                onClose={() => {
                  state.showProfileEditorModal = false;
                }}
              />
            </div>
          </div>
        )}
        {!isMySelf && (
          <div className="flex items-stretch">
            <div className="flex flex-col justify-center items-center mr-10">
              {state.user?.profile?.mixinUID && (
                <div className="flex items-center mb-3">
                  <Button
                    size='small'
                    onClick={() => {
                      useMixinPayment({
                        name: state.user.profile.name || '',
                        mixinUID: state.user.profile.mixinUID || '',
                      });
                    }}
                  >
                    <img className="w-[9px] mr-[12px]" src={`${assetsBasePath}/buyadrink_white.svg`} alt="buyadrink_white" />
                    {lang.tip}
                  </Button>
                </div>
              )}
              {isGroupOwner && (
                <Button
                  size='small'
                  color="yellow"
                  onClick={() => {
                    if (authStore.deniedListMap[
                      `groupId:${activeGroup.group_id}|peerId:${publisher}`
                    ]) {
                      unBan(publisher);
                    } else {
                      ban(publisher);
                    }
                  }}
                >
                  <img className="w-[14px] mr-2" src={`${assetsBasePath}/post_ban.svg`} alt="post_ban" />
                  {authStore.deniedListMap[
                    `groupId:${activeGroup.group_id}|peerId:${publisher}`
                  ] ? lang.banned : lang.ban}
                </Button>
              )}
            </div>
            <div className="flex flex-col bg-gray-ec text-14 text-gray-6f cursor-pointer">
              <div
                className="flex-1 flex items-center justify-center border-b border-white py-[14px] w-28"
                onClick={() => {
                  if (activeGroupStore.followingSet.has(publisher)) {
                    unFollow(publisher);
                  } else {
                    follow(publisher);
                  }
                }}
              >
                {activeGroupStore.followingSet.has(publisher) ? <AiFillStar className="text-20 mr-[6px]" /> : <AiOutlineStar className="text-20 mr-[6px]" />}
                {activeGroupStore.followingSet.has(publisher) ? lang.following : lang.follow}
              </div>
              <div
                className="flex-1 flex items-center justify-center border-t border-white py-[14px] w-28"
                onClick={() => {
                  if (activeGroupStore.blockListSet.has(publisher)) {
                    allow(publisher);
                  } else {
                    block(publisher);
                  }
                }}
              >
                {activeGroupStore.blockListSet.has(publisher) ? <GoMute className="text-20 mr-2" /> : <HiOutlineBan className="text-18 mr-2" />}
                {activeGroupStore.blockListSet.has(publisher) ? lang.blocked : lang.block}
              </div>
            </div>
          </div>
        )}
        {isSyncing && (
          <Fade in={true} timeout={500}>
            <Tooltip
              enterDelay={400}
              enterNextDelay={400}
              placement="top"
              title={lang.syncingContentTip2}
              arrow
              interactive
            >
              <div className="px-2 py-1 bg-gray-88 rounded-bl-5 text-white text-12 absolute top-0 right-0 flex items-center">
                {lang.waitForSyncingDone} <RiCheckLine className="text-12 ml-1" />
              </div>
            </Tooltip>
          </Fade>
        )}
      </div>
    </div>
  );
});

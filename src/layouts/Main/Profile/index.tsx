import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { IDbSummary } from 'hooks/useDatabase/models/summary';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import getProfile from 'store/selectors/getProfile';
import { RiCheckLine } from 'react-icons/ri';
import { Tooltip, Fade } from '@material-ui/core';
import { IUser } from 'hooks/useDatabase/models/person';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { GoMute } from 'react-icons/go';
import { HiOutlineBan } from 'react-icons/hi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import DeniedListApi from 'apis/deniedList';
import sleep from 'utils/sleep';
import ProfileEditorModal from './ProfileEditorModal';
import useActiveGroupFollowingPublishers from 'store/selectors/useActiveGroupFollowingPublishers';
import useActiveGroupMutedPublishers from 'store/selectors/useActiveGroupMutedPublishers';

import BuyadrinkWhite from 'assets/buyadrink_white.svg';
import PostBan from 'assets/post_ban.svg';

import './index.scss';

interface IProps {
  publisher: string
}

export default observer((props: IProps) => {
  const { activeGroupStore, snackbarStore, authStore, followingStore, mutedListStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const publisher = props.publisher;
  const isMySelf = activeGroup.user_pubkey === publisher;
  const state = useLocalObservable(() => ({
    loading: false,
    user: {
      profile: getProfile(activeGroup.user_pubkey),
      objectCount: 0,
    } as IUser,
    summary: null as IDbSummary | null,
    showProfileEditorModal: false,
  }));
  const isSyncing = activeGroup.profileStatus !== ContentStatus.synced;
  const isGroupOwner = activeGroup.user_pubkey === activeGroup.owner_pubkey;
  const activeGroupFollowingPublishers = useActiveGroupFollowingPublishers();
  const isFollowing = activeGroupFollowingPublishers.includes(publisher);
  const activeGroupMutedPublishers = useActiveGroupMutedPublishers();
  const isBlocked = activeGroupMutedPublishers.includes(publisher);

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

  const follow = (publisher: string) => {
    followingStore.follow({
      groupId: activeGroupStore.id,
      publisher,
    });
  };

  const unFollow = (publisher: string) => {
    followingStore.unFollow({
      groupId: activeGroupStore.id,
      publisher,
    });
  };

  const block = (publisher: string) => {
    mutedListStore.block({
      groupId: activeGroupStore.id,
      publisher,
    });
  };

  const allow = (publisher: string) => {
    mutedListStore.allow({
      groupId: activeGroupStore.id,
      publisher,
    });
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

  return (
    <div
      className="relative overflow-hidden profile rounded-0 bg-white border border-gray-88 mb-3"
    >
      <div className="flex justify-between items-stretch text-black">
        {!isMySelf && (
          <>
            <div className="flex items-end py-[18px] pl-10">
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
                <div className="mt-10-px text-14 text-gray-4a pb-1 font-normal tracking-wide">
                  {lang.contentCount(state.user.objectCount)}
                </div>
              </div>
            </div>
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
                      <img className="w-[9px] mr-[12px]" src={BuyadrinkWhite} alt="buyadrink_white" />
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
                    <img className="w-[14px] mr-2" src={PostBan} alt="post_ban" />
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
                    if (isFollowing) {
                      unFollow(publisher);
                    } else {
                      follow(publisher);
                    }
                  }}
                >
                  {isFollowing ? <AiFillStar className="text-20 mr-[6px]" /> : <AiOutlineStar className="text-20 mr-[6px]" />}
                  {isFollowing ? lang.following : lang.follow}
                </div>
                <div
                  className="flex-1 flex items-center justify-center border-t border-white py-[14px] w-28"
                  onClick={() => {
                    if (isBlocked) {
                      allow(publisher);
                    } else {
                      block(publisher);
                    }
                  }}
                >
                  {isBlocked ? <GoMute className="text-20 mr-2" /> : <HiOutlineBan className="text-18 mr-2" />}
                  {isBlocked ? lang.blocked : lang.block}
                </div>
              </div>
            </div>
          </>
        )}
        {isMySelf && (
          <>
            <div className="flex items-end py-[18px] pl-10">
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
          </>
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

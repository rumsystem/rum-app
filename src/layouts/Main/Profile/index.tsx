import React from 'react';
import classNames from 'classnames';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { utils } from 'rum-sdk-browser';
import { GoMute } from 'react-icons/go';
import { RiCheckLine } from 'react-icons/ri';
import { HiOutlineBan } from 'react-icons/hi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { Tooltip, Fade, FormGroup, FormControlLabel, Switch } from '@mui/material';

import Button from 'components/Button';
import Avatar from 'components/Avatar';

import { useStore } from 'store';
import { isGroupOwner } from 'store/selectors/group';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useActiveGroupFollowingUserAddresses from 'store/selectors/useActiveGroupFollowingUserAddresses';
import useActiveGroupMutedUserAddress from 'store/selectors/useActiveGroupMutedUserAddress';
import useCheckPermission from 'hooks/useCheckPermission';
import useUpdatePermission from 'hooks/useUpdatePermission';

import useDatabase from 'hooks/useDatabase';
import { IDbSummary } from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import useSubmitRelation from 'hooks/useSubmitRelation';

import openTransferModal from 'standaloneModals/wallet/openTransferModal';

import sleep from 'utils/sleep';
import { lang } from 'utils/lang';

import BuyadrinkWhite from 'assets/buyadrink_white.svg';

import ProfileEditorModal from './ProfileEditorModal';

import './index.scss';

interface IProps {
  publisher: string
}

export default observer((props: IProps) => {
  const activeGroup = useActiveGroup();
  const {
    groupStore,
    activeGroupStore,
    snackbarStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    loading: false,
    banDialog: {
      type: 'ban' as 'ban' | 'unban',
      open: false,
      reason: '',
    },
    summary: null as IDbSummary | null,
    showProfileEditorModal: false,
    hasPostPermission: false,
    profile: groupStore.profileMap[activeGroup.group_id],
  }));
  const database = useDatabase();
  const submitRelation = useSubmitRelation();
  const activeGroupFollowingUserAddresses = useActiveGroupFollowingUserAddresses();
  const activeGroupMutedUserAddresses = useActiveGroupMutedUserAddress();
  const checkPermission = useCheckPermission();
  const updatePermission = useUpdatePermission();

  const profile = groupStore.profileMap[activeGroup.group_id];
  const isMySelf = activeGroup.user_pubkey === props.publisher;
  const isSyncing = isMySelf && !!profile && profile.status !== ContentStatus.synced;
  const isOwner = isGroupOwner(activeGroup);
  const userAddress = React.useMemo(() => utils.pubkeyToAddress(props.publisher), [props.publisher]);
  const isFollowing = activeGroupFollowingUserAddresses.includes(userAddress);
  const muted = activeGroupMutedUserAddresses.includes(userAddress);

  React.useEffect(() => {
    (async () => {
      state.hasPostPermission = await checkPermission({
        groupId: activeGroupStore.id,
        publisher: props.publisher,
        trxType: 'POST',
      });
    })();
  }, [props.publisher]);

  React.useEffect(() => {
    (async () => {
      const setLoadingTimeout = window.setTimeout(() => {
        runInAction(() => {
          state.loading = true;
        });
      }, 200);
      const db = database;
      if (isMySelf) {
        await groupStore.updateProfile(db, activeGroupStore.id);
        runInAction(() => {
          state.profile = groupStore.profileMap[activeGroup.group_id];
        });
      } else {
        const profile = await ProfileModel.get(db, {
          groupId: activeGroupStore.id,
          publisher: props.publisher,
          useFallback: true,
        });
        runInAction(() => {
          state.profile = profile;
        });
      }
      window.clearTimeout(setLoadingTimeout);
      runInAction(() => {
        state.loading = false;
      });
    })();
  }, [state, props.publisher, activeGroup.user_pubkey, activeGroupStore.profile]);

  const follow = (publisher: string) => {
    submitRelation({
      to: publisher,
      type: 'follow',
    });
  };

  const unFollow = (publisher: string) => {
    submitRelation({
      to: publisher,
      type: 'undofollow',
    });
  };

  const mute = (publisher: string) => {
    submitRelation({
      to: publisher,
      type: 'block',
    });
  };

  const unmute = (publisher: string) => {
    submitRelation({
      to: publisher,
      type: 'undoblock',
    });
  };

  const handlePermissionConfirm = async () => {
    try {
      await updatePermission({
        groupId: activeGroupStore.id,
        publisher: props.publisher,
        trxType: 'POST',
        action: state.hasPostPermission ? 'deny' : 'allow',
      });
      await sleep(200);
      state.hasPostPermission = !state.hasPostPermission;
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div className="relative overflow-hidden profile rounded-0 bg-white border border-gray-88 mb-3">
      <div className="flex justify-between items-stretch text-black">
        {!isMySelf && (
          <>
            <div className="flex items-end py-[18px] pl-10">
              <Avatar
                className={classNames(
                  state.loading && 'invisible',
                  'bg-white ml-1',
                )}
                loading={isSyncing}
                avatar={state.profile?.avatar}
                size={74}
              />
              <div className="ml-5">
                <div
                  className={classNames(
                    state.loading && 'invisible',
                    'font-bold text-18 leading-none text-gray-4a flex items-center',
                  )}
                >
                  {state.profile?.name}
                  {isOwner && (
                    <div className="ml-2 transform scale-75 text-gray-88" onClick={handlePermissionConfirm}>
                      <FormGroup>
                        <FormControlLabel
                          control={<Switch checked={state.hasPostPermission} color='primary' />}
                          label={lang.writable}
                        />
                      </FormGroup>
                    </div>
                  )}
                </div>
                <div className="mt-10-px text-14 text-gray-4a pb-1 font-normal tracking-wide">
                  {lang.contentCount(state.profile?.extra.postCount ?? 0)}
                </div>
              </div>
            </div>
            <div className="flex items-stretch">
              <div className="flex flex-col justify-center items-center mr-10">
                <div className="flex items-center mb-3">
                  <Button
                    size='small'
                    onClick={() => {
                      openTransferModal({
                        name: state.profile?.name || '',
                        avatar: state.profile?.avatar || '',
                        pubkey: state.profile?.publisher || '',
                      });
                    }}
                  >
                    <img className="w-[9px] mr-[12px]" src={BuyadrinkWhite} alt="buyadrink_white" />
                    {lang.tip}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col bg-gray-ec text-14 text-gray-6f cursor-pointer">
                <div
                  className="flex-1 flex items-center justify-center border-b border-white py-[14px] w-28"
                  onClick={() => {
                    if (isFollowing) {
                      unFollow(props.publisher);
                    } else {
                      follow(props.publisher);
                    }
                  }}
                >
                  {isFollowing ? <AiFillStar className="text-20 mr-[6px]" /> : <AiOutlineStar className="text-20 mr-[6px]" />}
                  {isFollowing ? lang.following : lang.follow}
                </div>
                <div
                  className="flex-1 flex items-center justify-center border-t border-white py-[14px] w-28"
                  onClick={() => {
                    if (muted) {
                      unmute(props.publisher);
                    } else {
                      mute(props.publisher);
                    }
                  }}
                >
                  {muted ? <GoMute className="text-20 mr-2" /> : <HiOutlineBan className="text-18 mr-2" />}
                  {muted ? lang.muted : lang.mute}
                </div>
              </div>
            </div>
          </>
        )}

        {isMySelf && (
          <>
            <div className="flex items-end py-[18px] pl-10">
              <Avatar
                className="bg-white ml-1"
                loading={isSyncing || state.loading}
                avatar={state.profile?.avatar}
                size={74}
              />
              <div className="ml-5">
                <div
                  className="font-bold text-18 leading-none text-gray-4a flex items-center"
                  data-test-id="profile-page-user-name"
                >
                  {state.profile?.name ?? state.profile?.publisher.slice(-10, -2) ?? '...'}
                </div>
                <div className="mt-10-px text-14 text-gray-9b pb-1 font-bold tracking-wide">
                  {lang.contentCount(state.profile?.extra.postCount ?? 0)}
                </div>
              </div>
            </div>
            <div
              className={classNames(
                isSyncing && 'mt-4',
                'mr-10 flex items-center',
              )}
            >
              <div>
                <Button
                  outline
                  className="opacity-60"
                  onClick={action(() => { state.showProfileEditorModal = true; })}
                  data-test-id="profile-edit-button"
                >
                  {lang.editProfile}
                </Button>
                <ProfileEditorModal
                  open={state.showProfileEditorModal}
                  onClose={action(() => { state.showProfileEditorModal = false; })}
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
            >
              <div
                className="px-2 py-1 bg-gray-88 rounded-bl-5 text-white text-12 absolute top-0 right-0 flex items-center"
                data-test-id="profile-wait-for-sync-tip"
              >
                {lang.waitForSyncingDone} <RiCheckLine className="text-12 ml-1" />
              </div>
            </Tooltip>
          </Fade>
        )}
      </div>
    </div>
  );
});

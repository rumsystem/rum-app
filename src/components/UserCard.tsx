import React from 'react';
import { runInAction } from 'mobx';
import { utils } from 'rum-sdk-browser';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Tooltip } from '@mui/material';
import Avatar from 'components/Avatar';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import { IDBComment } from 'hooks/useDatabase/models/comment';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import * as PostModel from 'hooks/useDatabase/models/posts';
import useDatabase from 'hooks/useDatabase';
import useSubmitRelation from 'hooks/useSubmitRelation';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useActiveGroupFollowingUserAddresses from 'store/selectors/useActiveGroupFollowingUserAddresses';
import useActiveGroupMutedUserAddress from 'store/selectors/useActiveGroupMutedUserAddress';
import { lang } from 'utils/lang';
import { GoMute } from 'react-icons/go';
import { HiOutlineBan } from 'react-icons/hi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

interface Props {
  className?: string
  disableHover?: boolean
  object: IDBPost | IDBComment
  beforeGoToUserPage?: () => unknown
  children?: React.ReactNode
}

const UserCard = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    gotObjectsCount: false,
    objectsCount: props.object.extra.user.extra.postCount,
  }));
  const db = useDatabase();
  const { activeGroupStore } = useStore();
  const { user } = props.object.extra;
  const { publisher } = user;
  const { profileMap } = activeGroupStore;
  const profile = profileMap[props.object.publisher] || props.object.extra.user;
  const activeGroup = useActiveGroup();
  const submitRelation = useSubmitRelation();
  const activeGroupFollowingUserAddresses = useActiveGroupFollowingUserAddresses();
  const userAddress = React.useMemo(() => utils.pubkeyToAddress(publisher), [publisher]);
  const isFollowing = activeGroupFollowingUserAddresses.includes(userAddress);
  const activeGroupMutedUserAddresses = useActiveGroupMutedUserAddress();
  const muted = activeGroupMutedUserAddresses.includes(userAddress);

  const goToUserPage = async (publisher: string) => {
    if (props.beforeGoToUserPage) {
      await props.beforeGoToUserPage();
    }
    activeGroupStore.setPostsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  const getObjectsCount = () => {
    if (state.gotObjectsCount) {
      return;
    }
    runInAction(() => {
      state.gotObjectsCount = true;
    });
    db.transaction('r', [db.posts], async () => {
      const postCount = await PostModel.getPostCount(db, {
        groupId: props.object.groupId,
        publisher: props.object.extra.user.publisher,
      });
      runInAction(() => {
        state.objectsCount = postCount;
      });
    });
  };

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

  const titleBox = (
    <div className="bg-white mr-2 shadow-lg border border-black leading-none">
      <div
        className="p-4 px-5 h-20 cursor-pointer bg-black w-72 flex items-stretch"
        onClick={() => goToUserPage(user.publisher)}
      >
        <div className="relative flex items-center">
          <Avatar
            className="absolute top-0 left-0 cursor-pointer"
            avatar={profile.avatar}
            size={50}
          />
          <div className="pl-16 pt-2 text-white">
            <div className="font-bold text-16 truncate w-44">
              {profile.name}
            </div>
            {activeGroup.owner_pubkey === user.publisher && (
              <div className="opacity-50 text-12 mt-[10px]">
                {lang.owner}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-5 tracking-wide opacity-90 text-blue-400 text-15 text-center cursor-pointer" onClick={() => goToUserPage(user.publisher)}>
        {lang.totalObjects(state.objectsCount)}
      </div>

      {activeGroup.user_pubkey !== publisher && (
        <div className="flex items-stretch bg-gray-ec text-14 text-gray-6f cursor-pointer">
          <div
            className="flex-1 flex items-center justify-center border-r border-white py-[14px]"
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
            className="flex-1 flex items-center justify-center border-l border-white py-[14px]"
            onClick={() => {
              if (muted) {
                unmute(publisher);
              } else {
                mute(publisher);
              }
            }}
          >
            {muted ? <GoMute className="text-20 mr-2" /> : <HiOutlineBan className="text-18 mr-2" />}
            {muted ? lang.muted : lang.mute}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      classes={{
        tooltip: 'bg-transparent m-0 p-0',
      }}
      disableHoverListener={props.disableHover}
      enterDelay={450}
      enterNextDelay={450}
      placement="left"
      title={titleBox}
    >
      <div
        className={props.className}
        onMouseEnter={getObjectsCount}
        onClick={() => goToUserPage(props.object.publisher)}
      >
        {props.children}
      </div>
    </Tooltip>
  );
});

export default UserCard;

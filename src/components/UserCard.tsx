import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from 'components/Avatar';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useActiveGroupFollowingPublishers from 'store/selectors/useActiveGroupFollowingPublishers';
import useActiveGroupMutedPublishers from 'store/selectors/useActiveGroupMutedPublishers';
import { lang } from 'utils/lang';
import { GoMute } from 'react-icons/go';
import { HiOutlineBan } from 'react-icons/hi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

interface Props {
  disableHover?: boolean
  object: IDbDerivedObjectItem | IDbDerivedCommentItem
  beforeGoToUserPage?: () => unknown
  children?: React.ReactNode
}

const UserCard = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    gotObjectsCount: false,
    objectsCount: props.object.Extra.user.objectCount,
  }));
  const db = useDatabase();
  const { activeGroupStore, followingStore, mutedListStore } = useStore();
  const { user } = props.object.Extra;
  const { publisher } = user;
  const { profileMap } = activeGroupStore;
  const profile = profileMap[props.object.Publisher] || props.object.Extra.user.profile;
  const activeGroup = useActiveGroup();
  const activeGroupFollowingPublishers = useActiveGroupFollowingPublishers();
  const isFollowing = activeGroupFollowingPublishers.includes(publisher);
  const activeGroupMutedPublishers = useActiveGroupMutedPublishers();
  const muted = activeGroupMutedPublishers.includes(publisher);

  const goToUserPage = async (publisher: string) => {
    if (props.beforeGoToUserPage) {
      await props.beforeGoToUserPage();
    }
    activeGroupStore.setObjectsFilter({
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
    db.transaction('r', [db.persons, db.summary], async () => {
      const user = await PersonModel.getUser(db, {
        GroupId: props.object.GroupId,
        Publisher: props.object.Extra.user.publisher,
        withObjectCount: true,
      });
      runInAction(() => {
        state.objectsCount = user.objectCount;
      });
    });
  };

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

  const mute = (publisher: string) => {
    mutedListStore.mute({
      groupId: activeGroupStore.id,
      publisher,
    });
  };

  const unmute = (publisher: string) => {
    mutedListStore.unmute({
      groupId: activeGroupStore.id,
      publisher,
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
            url={profile.avatar}
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
      interactive
    >
      <div
        onMouseEnter={getObjectsCount}
        onClick={() => goToUserPage(props.object.Publisher)}
      >
        {props.children}
      </div>
    </Tooltip>
  );
});

export default UserCard;

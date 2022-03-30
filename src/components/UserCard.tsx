import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from 'components/Avatar';
import Button from 'components/Button';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

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
  const { activeGroupStore } = useStore();
  const { user } = props.object.Extra;
  const { profileMap } = activeGroupStore;
  const profile = profileMap[props.object.Publisher] || props.object.Extra.user.profile;
  const activeGroup = useActiveGroup();
  const isMySelf = activeGroup.user_pubkey === user.publisher;

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

  const titleBox = (
    <div className="p-5 flex items-center justify-between bg-white rounded-8 border border-gray-d8 mr-2 shadow-lg">
      <div
        className="relative pl-[50px] mr-10 cursor-pointer py-1"
        onClick={() => goToUserPage(user.publisher)}
      >
        <Avatar
          className="absolute top-0 left-0 cursor-pointer"
          profile={profile}
          size={50}
        />
        <div className="pl-3 pt-1 w-[90px]">
          <div className="text-gray-88 font-bold text-14 truncate">
            {profile.name}
          </div>
          <div className="mt-[6px] text-12 text-gray-af tracking-wide opacity-90">
            {lang.totalObjects(state.objectsCount)}
          </div>
        </div>
      </div>

      {!isMySelf && !!profile?.mixinUID && (
        <div className="opacity-80">
          <Button
            size="mini"
            outline
            onClick={() => useMixinPayment({
              name: profile.name || '',
              mixinUID: profile.mixinUID || '',
            })}
          >
            打赏
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      disableHoverListener={props.disableHover}
      enterDelay={450}
      enterNextDelay={450}
      PopperProps={{
        className: 'no-style',
      }}
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

import React from 'react';
import { observer } from 'mobx-react-lite';
import GroupItem from './GroupItem';
import { IGroup } from 'apis/group';
import { useStore } from 'store';
import { ListType } from './ListTypeSwitcher';
import classNames from 'classnames';

type IGroupItem = IGroup & {
  isOwner: boolean
};

interface IProps {
  groups: IGroupItem[]
  highlight: string
  listType: ListType
}

export default observer((props: IProps) => {
  const {
    activeGroupStore,
  } = useStore();

  const handleOpenGroup = (groupId: string) => {
    if (activeGroupStore.switchLoading) {
      return;
    }

    if (activeGroupStore.id !== groupId) {
      activeGroupStore.setSwitchLoading(true);
      activeGroupStore.setId(groupId);
    }
  };

  return (
    <div className={classNames({
      'grid grid-cols-3 gap-x-3 gap-y-4 py-5 px-[11px]': props.listType === ListType.icon,
    })}
    >
      {props.groups.map((group) => (
        <GroupItem
          group={group}
          key={group.group_id}
          onOpen={() => handleOpenGroup(group.group_id)}
          highlight={props.highlight || ''}
          listType={props.listType}
        />
      ))}
    </div>
  );
});

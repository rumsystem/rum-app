import React from 'react';
import { observer } from 'mobx-react-lite';
import GroupItem from './GroupItem';
import { IGroup } from 'apis/group';
import { useStore } from 'store';

type IGroupItem = IGroup & {
  isOwner: boolean
};

interface IProps {
  groups: IGroupItem[]
  highlight: string
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
    <div>
      {props.groups.map((group) => (
        <GroupItem
          group={group}
          key={group.group_id}
          onOpen={() => handleOpenGroup(group.group_id)}
          highlight={props.highlight || ''}
        />
      ))}
    </div>
  );
});

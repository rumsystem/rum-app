import { useStore } from 'store';
import { isGroupOwner } from 'store/selectors/group';

export default () => {
  const { groupStore, activeGroupStore } = useStore();
  return isGroupOwner(groupStore.map[activeGroupStore.id] || {});
};

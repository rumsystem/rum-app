import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';

export default () => {
  const { groupStore, activeGroupStore } = useStore();
  return useIsGroupOwner(groupStore.map[activeGroupStore.id] || {});
};

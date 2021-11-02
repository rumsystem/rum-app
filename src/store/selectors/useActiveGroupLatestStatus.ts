import { useStore } from 'store';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default () => {
  const { activeGroupStore, groupStore } = useStore();

  return (
    groupStore.latestStatusMap[activeGroupStore.id] || DEFAULT_LATEST_STATUS
  );
};

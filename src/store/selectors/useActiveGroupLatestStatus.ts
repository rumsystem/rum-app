import { useStore } from 'store';

export default () => {
  const { activeGroupStore, latestStatusStore } = useStore();

  return (
    latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS
  );
};

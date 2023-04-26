import { Store } from 'store';

export default (store: Store) => {
  const { activeGroupStore, latestStatusStore } = store;
  const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  return activeGroupStore.objects.find((o) => o.TimeStamp <= latestStatus.latestReadTimeStamp);
};

import { Store } from 'store';

export default (store: Store) => {
  const { activeGroupStore, latestStatusStore } = store;
  const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  return activeGroupStore.posts.find((o) => o.timestamp <= latestStatus.latestReadTimeStamp);
};

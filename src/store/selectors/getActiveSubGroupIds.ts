import { Store } from 'store';

export default (store: Store) => {
  const { activeGroupStore, groupStore } = store;
  if (!activeGroupStore.id) {
    return [];
  }
  return groupStore.topToSubsMap[activeGroupStore.id] || [];
};

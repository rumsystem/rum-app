import { useStore } from 'store';

export default () => {
  const { groupStore, activeGroupStore } = useStore();
  return groupStore.map[activeGroupStore.id] || {};
};

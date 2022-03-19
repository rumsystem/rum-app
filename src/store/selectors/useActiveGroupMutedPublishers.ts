import { useStore } from 'store';

export default () => {
  const { activeGroupStore, mutedListStore } = useStore();
  return mutedListStore.mutedList.filter((muted) => muted.groupId === activeGroupStore.id).map((muted) => muted.publisher);
};

import { useStore } from 'store';

export default () => {
  const { activeGroupStore, followingStore } = useStore();
  return followingStore.followings.filter((following) => following.groupId === activeGroupStore.id).map((following) => following.publisher);
};

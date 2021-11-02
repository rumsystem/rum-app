import { useStore } from 'store';

export default (userId?: string) => {
  const { activeGroupStore, nodeStore, authStore } = useStore();

  return !authStore.blacklistMap[
    `groupId:${activeGroupStore.id}|userId:${userId || nodeStore.info.node_id}`
  ];
};

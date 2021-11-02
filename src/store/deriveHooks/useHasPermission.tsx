import { useStore } from 'store';

export default () => {
  const { activeGroupStore, nodeStore, authStore } = useStore();

  return !authStore.blacklistMap[
    `groupId:${activeGroupStore.id}|userId:${nodeStore.info.user_id}`
  ];
};

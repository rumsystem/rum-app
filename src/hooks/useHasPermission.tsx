import { useStore } from 'store';

export default () => {
  const { groupStore, nodeStore, authStore } = useStore();

  return !authStore.blacklistMap[
    `groupId:${groupStore.id}|userId:${nodeStore.info.user_id}`
  ];
};

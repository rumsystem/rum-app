import { useStore } from 'store';

export default (publicKey?: string) => {
  const { activeGroupStore, nodeStore, authStore } = useStore();

  return !authStore.blacklistMap[
    `groupId:${activeGroupStore.id}|publicKey:${
      publicKey || nodeStore.info.node_publickey
    }`
  ];
};

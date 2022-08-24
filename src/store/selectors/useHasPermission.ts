import { useStore } from 'store';
import useActiveGroup from './useActiveGroup';

export default (publicKey?: string) => {
  const { activeGroupStore, authStore } = useStore();
  const activeGroup = useActiveGroup();

  return !authStore.deniedListMap[
    `groupId:${activeGroupStore.id}|peerId:${
      publicKey || activeGroup.user_pubkey
    }`
  ];
};

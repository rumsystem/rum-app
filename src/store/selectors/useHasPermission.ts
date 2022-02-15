import { useStore } from 'store';
import useActiveGroup from './useActiveGroup';

export default (publicKey?: string) => {
  const { activeGroupStore, authStore } = useStore();
  const activeGroup = useActiveGroup();

  const key = `groupId:${activeGroupStore.id}|peerId:${publicKey || activeGroup.user_pubkey}`;
  const banned = authStore.deniedListMap[key]?.banned ?? false;
  return !banned;
};

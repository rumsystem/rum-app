import { useStore } from 'store';

export default () => {
  const { groupStore, nodeStore } = useStore();

  return `newContents|userId:${nodeStore.info.user_id}|groupId:${groupStore.id}`;
};

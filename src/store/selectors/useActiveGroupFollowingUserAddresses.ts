import { useStore } from 'store';

export default () => {
  const { activeGroupStore, relationStore, groupStore } = useStore();
  const group = groupStore.map[activeGroupStore.id];
  if (!group) { return []; }
  const relations = relationStore.byGroupId.get(group.group_id) ?? [];
  return relations
    .filter((v) => v.from === group.user_eth_addr && v.type === 'follow' && !!v.value)
    .map((v) => v.to);
};

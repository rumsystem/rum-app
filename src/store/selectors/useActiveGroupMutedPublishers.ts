import { useStore } from 'store';

export default () => {
  const { activeGroupStore, relationStore, groupStore } = useStore();
  const group = groupStore.map[activeGroupStore.id];
  if (!group) { return []; }
  const relations = relationStore.byGroupId.get(group.group_id) ?? [];
  return relations
    .filter((v) => v.from === group.user_pubkey && v.type === 'block' && !!v.value)
    .map((v) => v.to);
};

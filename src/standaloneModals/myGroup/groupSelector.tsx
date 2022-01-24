import { store } from 'store';
import { IGroup } from 'apis/group';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';

export default () => {
  const {
    groupStore,
  } = store;
  let groups: Array<IGroup & { role?: string }> = groupStore.groups;
  groups = groups.map((group) => {
    group.role = useIsGroupOwner(group) ? 'owner' : 'user';
    return group;
  });
  return groups;
};

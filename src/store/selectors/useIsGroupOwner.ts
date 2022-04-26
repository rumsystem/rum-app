import { useStore } from 'store';
import { isEmpty } from 'lodash';
import { IGroup } from 'apis/group';

export default (group: IGroup) => {
  const { nodeStore } = useStore();

  if (!group || isEmpty(group)) {
    return false;
  }

  return group.OwnerPubKey === nodeStore.info.node_publickey;
};

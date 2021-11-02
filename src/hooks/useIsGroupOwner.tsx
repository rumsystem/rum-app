import { useStore } from 'store';
import { isEmpty } from 'lodash';
import { Group } from 'apis/group';

export default (group: Group) => {
  const { nodeStore } = useStore();

  if (!group || isEmpty(group)) {
    return false;
  }

  return group.OwnerPubKey === nodeStore.nodeInfo.node_publickey;
};

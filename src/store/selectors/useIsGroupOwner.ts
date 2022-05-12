import { isEmpty } from 'lodash';
import { IGroup } from 'apis/group';

export default (group: IGroup) => {
  if (!group || isEmpty(group)) {
    return false;
  }

  return group.owner_pubkey === group.user_pubkey;
};

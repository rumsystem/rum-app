import React from 'react';
import { IGroup } from 'apis/group';
import UserApi from 'apis/user';

export default () => React.useCallback(async (group: IGroup) => {
  if (group.encryption_type.toLowerCase() !== 'private' || group.user_pubkey === group.owner_pubkey) {
    return true;
  }
  try {
    const ret = await UserApi.fetchUser(group.group_id, group.user_pubkey);
    return ret.Result === 'APPROVED';
  } catch (_) {
    return false;
  }
}, []);

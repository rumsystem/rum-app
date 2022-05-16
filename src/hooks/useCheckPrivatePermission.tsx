import React from 'react';
import { IGroup } from 'apis/group';
import UserApi from 'apis/user';
import {
  isGroupOwner,
  isPrivateGroup,
  isNoteGroup,
} from 'store/selectors/group';

export default () => React.useCallback(async (group: IGroup) => {
  if (isPrivateGroup(group)
    || isGroupOwner(group)
    || isNoteGroup(group)
  ) {
    return true;
  }
  try {
    const ret = await UserApi.fetchUser(group.group_id, group.user_pubkey);
    return ret.Result === 'APPROVED';
  } catch (_) {
    return false;
  }
}, []);

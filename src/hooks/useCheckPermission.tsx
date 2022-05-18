import React from 'react';
import AuthApi, { TrxType } from 'apis/auth';

export default () => React.useCallback(async (groupId: string, publisher: string, trxType: TrxType) => {
  const followingRule = await AuthApi.getFollowingRule(groupId, trxType);
  if (followingRule.AuthType === 'FOLLOW_ALW_LIST') {
    const allowList = await AuthApi.getAllowList(groupId) || [];
    return allowList.some((item) => item.Pubkey === publisher);
  }
  if (followingRule.AuthType === 'FOLLOW_DNY_LIST') {
    const denyList = await AuthApi.getDenyList(groupId) || [];
    return !denyList.some((item) => item.Pubkey === publisher);
  }
  return true;
}, []);

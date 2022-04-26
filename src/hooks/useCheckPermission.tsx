import React from 'react';
import AuthApi, { TrxType } from 'apis/auth';

interface IOptions {
  groupId: string
  publisher: string
  trxType: TrxType
}

export default () => React.useCallback(async ({
  groupId,
  publisher,
  trxType,
}: IOptions) => {
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

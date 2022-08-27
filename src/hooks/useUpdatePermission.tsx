import React from 'react';
import AuthApi, { TrxType } from 'apis/auth';

export default () => React.useCallback(async (groupId: string, publisher: string, trxType: TrxType, action: 'allow' | 'deny') => {
  const followingRule = await AuthApi.getFollowingRule(groupId, trxType);
  await AuthApi.updateAuthList({
    group_id: groupId,
    type: followingRule.AuthType === 'FOLLOW_ALW_LIST' ? 'upd_alw_list' : 'upd_dny_list',
    config: {
      action: followingRule.AuthType === 'FOLLOW_ALW_LIST'
        ? action === 'allow' ? 'add' : 'remove'
        : action === 'allow' ? 'remove' : 'add',
      pubkey: publisher,
      trx_type: [trxType],
      memo: '',
    },
  });
  return true;
}, []);

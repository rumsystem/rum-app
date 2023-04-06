import React from 'react';
import AuthApi, { TrxType } from 'apis/auth';
import type { TrxTypeLower } from 'rum-fullnode-sdk/dist/apis/auth';

interface IOptions {
  groupId: string
  publisher: string
  trxType: TrxType
  action: 'allow' | 'deny'
}

export default () => React.useCallback(async ({
  groupId,
  publisher,
  trxType,
  action,
}: IOptions) => {
  const followingRule = await AuthApi.getFollowingRule(groupId, trxType);
  await AuthApi.updateAuthList({
    group_id: groupId,
    type: followingRule.AuthType === 'FOLLOW_ALW_LIST' ? 'upd_alw_list' : 'upd_dny_list',
    config: {
      action: followingRule.AuthType === 'FOLLOW_ALW_LIST'
        ? action === 'allow' ? 'add' : 'remove'
        : action === 'allow' ? 'remove' : 'add',
      pubkey: publisher,
      trx_type: [trxType.toLowerCase() as TrxTypeLower],
      memo: '',
    },
  });
  return true;
}, []);

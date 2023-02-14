import { getClient } from './client';
import type {
  TrxTypeUpper,
  AuthTypeLower,
  TrxTypeLower,
} from 'rum-fullnode-sdk/dist/apis/auth';

export type TrxType = TrxTypeUpper;

export type AuthType = AuthTypeLower;

export default {
  async getFollowingRule(groupId: string, trxType: TrxType) {
    return getClient().Auth.getAuthRule(groupId, trxType);
  },

  async updateFollowingRule(params: {
    group_id: string
    type: 'set_trx_auth_mode'
    config: {
      trx_type: TrxType
      trx_auth_mode: AuthTypeLower
      memo: string
    }
  }) {
    return getClient().Auth.updateChainConfig(params);
  },

  async updateAuthList(params: {
    group_id: string
    type: 'upd_alw_list' | 'upd_dny_list'
    config: {
      action: 'add' | 'remove'
      pubkey: string
      trx_type: TrxTypeLower[]
      memo: string
    }
  }) {
    return getClient().Auth.updateChainConfig(params);
  },

  async getAllowList(groupId: string) {
    return getClient().Auth.getAllowList(groupId);
  },

  async getDenyList(groupId: string) {
    return getClient().Auth.getDenyList(groupId);
  },
};

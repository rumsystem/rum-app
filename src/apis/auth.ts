import { qwasm } from 'utils/quorum-wasm/load-quorum';
import { getClient } from './client';
import type {
  IFollowingRule,
  TrxTypeUpper,
  AuthTypeLower,
  TrxTypeLower,
  IUpdateChainConfigRes,
  IAllowOrDenyListItem,
} from 'rum-fullnode-sdk/dist/apis/auth';

export type TrxType = TrxTypeUpper;

export type AuthType = AuthTypeLower;

export default {
  async getFollowingRule(groupId: string, trxType: TrxType) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxAuthMode(groupId, trxType.toUpperCase()) as Promise<IFollowingRule>;
    }
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
    const body = {
      ...params,
      config: JSON.stringify({
        ...params.config,
        trx_auth_mode: params.config.trx_auth_mode.toLowerCase(),
      }),
    };
    if (!process.env.IS_ELECTRON) {
      return qwasm.MgrChainConfig(JSON.stringify(body)) as Promise<IUpdateChainConfigRes>;
    }
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
    const body = {
      ...params,
      config: JSON.stringify({
        ...params.config,
        trx_type: params.config.trx_type.map((item) => item.toLowerCase()),
      }),
    };
    if (!process.env.IS_ELECTRON) {
      return qwasm.MgrChainConfig(JSON.stringify(body)) as Promise<IUpdateChainConfigRes>;
    }
    return getClient().Auth.updateChainConfig(params);
  },

  async getAllowList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxAllowList(groupId) as Promise<Array<IAllowOrDenyListItem> | null>;
    }
    return getClient().Auth.getAllowList(groupId);
  },

  async getDenyList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxDenyList(groupId) as Promise<Array<IAllowOrDenyListItem> | null>;
    }
    return getClient().Auth.getDenyList(groupId);
  },
};

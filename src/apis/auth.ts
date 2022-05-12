import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export type TrxType = 'POST' | 'ANNOUNCE' | 'REQ_BLOCK_FORWARD' | 'REQ_BLOCK_BACKWARD' | 'BLOCK_SYNCED' | 'BLOCK_PRODUCED' | 'ASK_PEERID';

export type AuthType = 'FOLLOW_ALW_LIST' | 'FOLLOW_DNY_LIST';

export interface AuthResponse {
  'group_id': string
  'owner_pubkey': string
  'sign': string
  'trx_id': string
}

export interface AllowOrDenyListItem {
  Pubkey: string
  TrxType: TrxType
  GroupOwnerPubkey: string
  GroupOwnerSign: string
  TimeStamp: number
  Memo: string
}

export interface FollowingRule {
  'TrxType': TrxType
  'AuthType': AuthType
}

export default {
  async getFollowingRule(groupId: string, trxType: TrxType) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxAuthMode(groupId, trxType.toLowerCase()) as Promise<FollowingRule>;
    }
    return request(`/api/v1/group/${groupId}/trx/auth/${trxType.toLowerCase()}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<FollowingRule>;
  },

  async updateFollowingRule(params: {
    group_id: string
    type: 'set_trx_auth_mode'
    config: {
      trx_type: TrxType
      trx_auth_mode: AuthType
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
      return qwasm.MgrChainConfig(JSON.stringify(body)) as Promise<AuthResponse>;
    }
    return request('/api/v1/group/chainconfig', {
      method: 'POST',
      base: getBase(),
      body,
    }) as Promise<AuthResponse>;
  },

  async updateAuthList(params: {
    group_id: string
    type: 'upd_alw_list' | 'upd_dny_list'
    config: {
      action: 'add' | 'remove'
      pubkey: string
      trx_type: TrxType[]
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
      return qwasm.MgrChainConfig(JSON.stringify(body)) as Promise<AuthResponse>;
    }
    return request('/api/v1/group/chainconfig', {
      method: 'POST',
      base: getBase(),
      body,
    }) as Promise<AuthResponse>;
  },

  async getAllowList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxAllowList(groupId) as Promise<Array<AllowOrDenyListItem> | null>;
    }
    return request(`/api/v1/group/${groupId}/trx/allowlist`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<Array<AllowOrDenyListItem> | null>;
  },

  async getDenyList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetChainTrxDenyList(groupId) as Promise<Array<AllowOrDenyListItem> | null>;
    }
    return request(`/api/v1/group/${groupId}/trx/denylist`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<Array<AllowOrDenyListItem> | null>;
  },
};

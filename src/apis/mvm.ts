import request from '../request';
import qs from 'query-string';

const BASE = 'https://prs-bp2.press.one/api';

export default {
  account(address: string) {
    return request(`${BASE}/accounts/${address}`) as Promise<IAccountRes>;
  },

  bounds(address: string) {
    return request(`${BASE}/accounts/${address}/bounds`) as Promise<IBoundsRes>;
  },

  bind(mixinUUID: string) {
    return `https://prs-bp2.press.one/counter/?contract=RumAccount&func=selfBind&params=["MIXIN","${mixinUUID}","{\\"request\\":{\\"type\\":\\"MIXIN\\"}}",""]`;
  },

  coins() {
    return request(`${BASE}/coins/mirrored`) as Promise<ICoinsRes>;
  },

  deposit(p: {
    asset: string
    amount: string
    account: string
    native?: boolean
  }) {
    return `${BASE}/coins/deposit?${qs.stringify(p)}`;
  },

  transfer(p: {
    asset: string
    amount: string
    to: string
    uuid?: string
  }) {
    return `${BASE}/coins/transfer?${qs.stringify(p)}`;
  },

  transactions(p: {
    asset?: string
    account?: string
    count?: number
    sort?: string
    timestamp?: string
  }) {
    return request(`${BASE}/coins/transactions?${qs.stringify(p)}`) as Promise<ITransactionRes>;
  },

  withdraw(p: {
    asset: string
    amount: string
  }) {
    return `${BASE}/coins/withdraw?${qs.stringify(p)}`;
  },

  transactionUrl(hash: string) {
    return `https://explorer.rumsystem.net/tx/${hash}/internal-transactions`;
  },

  requestFee(p: {
    account: string
  }) {
    return request(`${BASE}/coins/fee`, {
      method: 'POST',
      body: p,
    });
  },

};

interface IRes {
  error: null | string
  success: boolean
}

interface IAsset {
  index: string
  id: string
  name: string
  icon: string
  rumAddress: string
  symbol: string
  symbolDisplay: string
  rumSymbol: string
  amount: string
}

interface IAccountRes extends IRes {
  data: {
    assets: Record<string, IAsset>
    bounds: Array<{
      meta: {
        request: {
          type: string
        }
      }
      user: string
      payment_provider: string
      payment_account: string
      memo: string
    }>
  }
}

interface IBoundsRes extends IRes {
  data: Array<IBound>
}

export interface IBound {
  meta: {
    request: {
      type: string
    }
  }
  user: string
  payment_provider: string
  payment_account: string
  memo: string
  profile: {
    type: string
    user_id: string
    identity_number: string
    phone: string
    full_name: string
    biography: string
    avatar_url: string
    relationship: string
    mute_until: string
    created_at: string
    is_verified: boolean
    is_scam: boolean
  }
}

interface ITransactionRes extends IRes {
  data: Array<ITransaction>
}

export interface ITransaction {
  amount: string
  asset: {
    index: number
    id: string
    name: string
    icon: string
    rumAddress: string
    symbol: string
    symbolDisplay: string
    rumSymbol: string
  }
  blockHash: string
  blockNumber: number
  from: string
  timestamp: string
  to: string
  transactionHash: string
  type: 'WITHDRAW' | 'DEPOSIT' | 'TRANSFER'
  uri: string
  uuid: string
}

interface ICoinsRes extends IRes {
  data: Record<string, INativeCoin | ICoin>
}

export interface ICoin {
  index: number
  id: string
  name: string
  icon: string
  rumAddress: string
  symbol: string
  symbolDisplay: string
  rumSymbol: string
  change_btc: string
  change_usd: string
  price_btc: string
  price_usd: string
  RumERC20: {
    name: string
    symbol: string
    totalSupply: string
    decimals: string
  }
}

export interface INativeCoin {
  index: number
  id: string
  name: string
  icon: string
  rumAddress: string
  symbol: string
  symbolDisplay: string
  rumSymbol: string
  native: boolean
  change_btc?: string
  change_usd?: string
  price_btc?: string
  price_usd?: string
}

import request from '../request';
import qs from 'query-string';

// interface IAnnounceGroupPriceExtra {
//   transactionHash: string
//   data: {
//     'action': 'ANNOUNCE_GROUP_PRICE'
//     'group_id': string
//     'rum_address': string
//     'amount': string
//     'duration': string
//   }
// }

interface IPayForGroupExtra {
  transactionUrl: string
  data: {
    'action': 'PAY_FOR_GROUP'
    'group_id': string
    'rum_address': string
    'amount': string
    'duration': string
  }
}

export interface IDapp {
  name: string
  version: string
  developer: string
  owner: string
  invokeFee: string
  shareRatio: string
  asset: {
    symbol: string
    symbolDisplay: string
    name: string
    id: string
  }
}

interface IGroup {
  duration: number
  mixinReceiver: string
  price: string
}

interface IPaidGroupDetailResponse {
  data: {
    dapp: IDapp
    group: IGroup | null
  }
}

interface IPaidGroupUserPaymentResponse {
  data: {
    dapp: IDapp
    group: IGroup | null
    payment: {
      expiredAt: number
      groupId: string
      price: string
    } | null
  }
}

interface IDappResponse {
  data: IDapp
}

export default {
  fetchDapp() {
    return request('https://prs-bp2.press.one/api/dapps/PaidGroupMvm') as Promise<IDappResponse>;
  },

  announceGroup(payload: {
    group: string
    owner: string
    amount: string
    duration: number
  }) {
    return request('https://prs-bp2.press.one/api/mvm/paidgroup/announce', {
      method: 'POST',
      body: payload,
    });
  },

  fetchGroupDetail(group: string) {
    return request(`https://prs-bp2.press.one/api/mvm/paidgroup/${group}`) as Promise<IPaidGroupDetailResponse>;
  },

  pay(payload: {
    user: string
    group: string
  }) {
    return request('https://prs-bp2.press.one/api/mvm/paidgroup/pay', {
      method: 'POST',
      body: payload,
    });
  },

  fetchUserPayment(groupId: string, userAddress: string) {
    return request(`https://prs-bp2.press.one/api/mvm/paidgroup/${groupId}/${userAddress}`) as Promise<IPaidGroupUserPaymentResponse>;
  },

  fetchTransactions(options: {
    count: number
    timestamp: string
  }) {
    return request(`https://prs-bp2.press.one/api/chain/transactions?${qs.stringify({
      contract: 'PaidGroup',
      ...options,
    })}`);
  },

  selector: {
    // getAnnounceGroupPriceExtras(transactions: any[]) {
    //   const result = [];
    //   for (const trx of transactions) {
    //     try {
    //       const { logs } = trx.content;
    //       for (const log of logs) {
    //         try {
    //           if (log.events.extra.action === 'ANNOUNCE_GROUP_PRICE') {
    //             result.push({
    //               transactionHash: log.transactionHash,
    //               data: log.events.extra
    //             });
    //           }
    //         } catch (_) {}
    //       }
    //     } catch (_) {}
    //   }
    //   return result as IAnnounceGroupPriceExtra[];
    // },

    getPayForGroupExtras(transactions: any[]) {
      const result = [];
      for (const trx of transactions) {
        try {
          const { logs } = trx.content;
          for (const log of logs) {
            try {
              if (log.events.extra.action === 'PAY_FOR_GROUP') {
                result.push({
                  transactionUrl: getTransactionUrl(log.transactionHash),
                  data: log.events.extra,
                });
              }
            } catch (_) {}
          }
        } catch (_) {}
      }
      return result as IPayForGroupExtra[];
    },
  },
};


const getTransactionUrl = (hash: string) => `https://explorer.rumsystem.net/tx/${hash}/internal-transactions`;

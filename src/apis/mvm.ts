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

interface IGroupDetail {
  duration: number
  mixinReceiver: string
  price: string
}

export default {
  announceGroup(payload: {
    group: string
    owner: string
    amount: string
    duration: number
  }) {
    return request('https://prs-bp2.press.one/api/paidgroup/announce', {
      method: 'POST',
      body: payload,
    });
  },

  fetchGroupDetail(group: string) {
    return request(`https://prs-bp2.press.one/api/paidgroup/${group}`) as Promise<{
      data: IGroupDetail
    }>;
  },

  pay(payload: {
    user: string
    group: string
  }) {
    return request('https://prs-bp2.press.one/api/paidgroup/pay', {
      method: 'POST',
      body: payload,
    });
  },

  fetchUserPayments(options: {
    user: string
    group: string
  }) {
    return request(`https://prs-bp2.press.one/api/paidgroup/${options.group}/${options.user}`);
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

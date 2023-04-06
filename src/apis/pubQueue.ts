import { getClient } from './client';

export type { IPubQueueTrx } from 'rum-fullnode-sdk/dist/apis/pubQueue';

export default {
  fetchPubQueue(groupId: string) {
    return getClient().PubQueue.list(groupId);
  },

  fetchTrxFromPubQueue(groupId: string, trxId: string) {
    return getClient().PubQueue.list(groupId, { trx: trxId });
  },

  acknowledge(trxIds: string[]) {
    return getClient().PubQueue.acknowledge(trxIds);
  },
};

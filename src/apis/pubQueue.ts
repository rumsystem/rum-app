import { qwasm } from 'utils/quorum-wasm/load-quorum';
import type { IPubQueueRes } from 'rum-fullnode-sdk/dist/apis/pubQueue';
import { getClient } from './client';

export type { IPubQueueTrx } from 'rum-fullnode-sdk/dist/apis/pubQueue';

export default {
  fetchPubQueue(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetPubQueue(groupId) as Promise<IPubQueueRes>;
    }
    return getClient().PubQueue.list(groupId);
  },

  fetchTrxFromPubQueue(groupId: string, trxId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetPubQueue(groupId, '', trxId) as Promise<IPubQueueRes>;
    }
    return getClient().PubQueue.list(groupId, { trx: trxId });
  },

  acknowledge(trxIds: string[]) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.PubQueueAck(...trxIds);
    }
    return getClient().PubQueue.acknowledge(trxIds);
  },
};

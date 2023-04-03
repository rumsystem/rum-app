import { getClient } from './client';

export type { ITrx } from 'rum-fullnode-sdk/dist/apis/trx';

export default {
  fetchTrx(GroupId: string, TrxId: string) {
    return getClient().Trx.get(GroupId, TrxId);
  },
};

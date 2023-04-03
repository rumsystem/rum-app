import { qwasm } from 'utils/quorum-wasm/load-quorum';
import type{ ITrx } from 'rum-fullnode-sdk/dist/apis/trx';
import { getClient } from './client';

export type { ITrx } from 'rum-fullnode-sdk/dist/apis/trx';

export default {
  fetchTrx(GroupId: string, TrxId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetTrx(GroupId, TrxId) as Promise<ITrx>;
    }
    return getClient().Trx.get(GroupId, TrxId);
  },
};

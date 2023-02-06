import { qwasm } from 'utils/quorum-wasm/load-quorum';
import { getClient } from './client';
import type { INode } from 'rum-fullnode-sdk/dist/apis/node';

export default {
  fetchMyNodeInfo() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetNodeInfo() as Promise<INode>;
    }
    return getClient().Node.get();
  },
};

import { qwasm } from 'utils/quorum-wasm/load-quorum';
import { getClient } from './client';
import type { INetwork } from 'rum-fullnode-sdk/dist/apis/network';

export type { INetwork } from 'rum-fullnode-sdk/dist/apis/network';

export type INetworkGroup = Exclude<INetwork['groups'], null>[number];

export default {
  fetchNetwork() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetNetwork() as Promise<INetwork>;
    }
    return getClient().Network.get();
  },
};

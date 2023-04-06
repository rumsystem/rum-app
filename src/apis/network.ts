import { getClient } from './client';
import type { INetwork } from 'rum-fullnode-sdk/dist/apis/network';

export type { INetwork } from 'rum-fullnode-sdk/dist/apis/network';

export type INetworkGroup = Exclude<INetwork['groups'], null>[number];

export default {
  fetchNetwork() {
    return getClient().Network.get();
  },
};

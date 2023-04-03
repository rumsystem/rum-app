import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface INetworkGroup {
  GroupId: string
  GroupName: string
  Peers: string[] | null
}

export interface INetwork {
  groups: INetworkGroup[] | null
  addrs: string[]
  ethaddr: string
  nat_enabled: boolean
  nat_type: string
  peerid: string
  node: any
}

export default {
  fetchNetwork() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetNetwork() as Promise<INetwork>;
    }
    return request('/api/v1/network', {
      method: 'GET',
      base: getBase(),
    }) as Promise<INetwork>;
  },
};

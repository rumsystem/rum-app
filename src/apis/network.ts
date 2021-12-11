import request from '../request';
import getBase from 'utils/getBase';

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
    return request('/api/v1/network', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<INetwork>;
  },
};

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

export interface INetworkStatsSummaryItem {
  action: string
  failed_count: number
  in_size: number
  out_size: number
  success_count: number
}

export interface INetworkStatsSummary {
  [key: string]: INetworkStatsSummaryItem
  connect_peer: INetworkStatsSummaryItem
  join_topic: INetworkStatsSummaryItem
  publish_to_peerid: INetworkStatsSummaryItem
  publish_to_topic: INetworkStatsSummaryItem
  receive_from_topic: INetworkStatsSummaryItem
  rum_chain_data: INetworkStatsSummaryItem
  subscribe_topic: INetworkStatsSummaryItem
}

export interface INetworkStats {
  summary: INetworkStatsSummary
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
  fetchNetworkStats(start: string, end: string) {
    return request(`/api/v1/network/stats?start=${start}&end=${end}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<INetworkStats>;
  },
};

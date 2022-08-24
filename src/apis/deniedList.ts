import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface IDeniedListPayload {
  peer_id: string
  group_id: string
  action: 'add' | 'del'
}

export interface IDeniedItem {
  Action: string
  GroupId: string
  GroupOwnerPubkey: string
  GroupOwnerSign: string
  Memo: string
  PeerId: string
  TimeStamp: number
}

export type DeniedList = IDeniedItem[];

export default {
  fetchDeniedList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetDeniedUserList(groupId) as Promise<DeniedList>;
    }
    return request(`/api/v1/group/${groupId}/deniedlist`, {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<DeniedList>;
  },
  submitDeniedList(deniedList: IDeniedListPayload) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.MgrGrpBlkList(JSON.stringify(deniedList)) as Promise<DeniedList>;
    }
    return request('/api/v1/group/deniedlist', {
      method: 'POST',
      base: getBase(),
      body: deniedList,
      jwt: true,
    }) as Promise<DeniedList>;
  },
};

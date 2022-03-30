import request from '../request';
import getBase from 'utils/getBase';

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
    return request(`/api/v1/group/${groupId}/deniedlist`, {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<DeniedList>;
  },
  submitDeniedList(deniedList: IDeniedListPayload) {
    return request('/api/v1/group/deniedlist', {
      method: 'POST',
      base: getBase(),
      body: deniedList,
      jwt: true,
    }) as Promise<DeniedList>;
  },
};

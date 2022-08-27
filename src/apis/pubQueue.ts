import request from '../request';
import getBase from 'utils/getBase';
import type { ITrx } from './trx';

interface IPubQueueResponse {
  Data: IPubQueueTrx[]
  GroupId: string
}

export interface IPubQueueTrx {
  GroupId: string
  RetryCount: number
  State: 'SUCCESS' | 'PENDING' | 'FAIL'
  UpdateAt: number
  Trx: ITrx
}

export default {
  fetchPubQueue(groupId: string) {
    return request(`/api/v1/group/${groupId}/pubqueue`, {
      base: getBase(),
    }) as Promise<IPubQueueResponse>;
  },

  fetchTrxFromPubQueue(groupId: string, trxId: string) {
    return request(`/api/v1/group/${groupId}/pubqueue?trx=${trxId}`, {
      base: getBase(),
    }) as Promise<IPubQueueResponse>;
  },
};

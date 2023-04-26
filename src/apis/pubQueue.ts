import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';
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
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetPubQueue(groupId) as Promise<IPubQueueResponse>;
    }
    return request(`/api/v1/group/${groupId}/pubqueue`, {
      base: getBase(),
    }) as Promise<IPubQueueResponse>;
  },

  fetchTrxFromPubQueue(groupId: string, trxId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetPubQueue(groupId, '', trxId) as Promise<IPubQueueResponse>;
    }
    return request(`/api/v1/group/${groupId}/pubqueue?trx=${trxId}`, {
      base: getBase(),
    }) as Promise<IPubQueueResponse>;
  },

  acknowledge(trxIds: string[]) {
    return request('/api/v1/trx/ack', {
      method: 'POST',
      base: getBase(),
      body: {
        trx_ids: trxIds,
      },
    });
  },
};

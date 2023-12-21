import request from '../request';
import getBase from 'utils/getBase';

export interface ITrx {
  TrxId: string
  GroupId: string
  SenderPubkey: string
  Data: string
  TimeStamp: number
  Version: string
  Expired: number
  SenderSign: string
}

export default {
  fetchTrx(GroupId: string, TrxId: string) {
    return request(`/api/v1/trx/${GroupId}/${TrxId}`, {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<ITrx>;
  },
};

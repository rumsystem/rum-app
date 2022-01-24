import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface IAnnouncedProducer {
  Action: 'ADD' | 'REMOVE'
  AnnouncedPubkey: string
  AnnouncerSign: string
  Result: 'ANNOUNCED' | 'APPROVED'
  Memo: string
  TimeStamp: number
}

export interface IApprovedProducer {
  ProducerPubkey: string
  OwnerPubkey: string
  OwnerSign: string
  TimeStamp: number
  BlockProduced: number
}

export default {
  announce(data: {
    group_id: string
    action: 'add' | 'remove'
    type: 'producer'
    memo: string
  }) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.Announce(JSON.stringify(data)) as Promise<{
        group_id: string
        sign_pubkey: string
        encrypt_pubkey: string
        type: string
        action: string
        sign: string
        trx_id: string
      }>;
    }
    return request('/api/v1/group/announce', {
      method: 'POST',
      base: getBase(),
      body: data,
      jwt: true,
    }) as Promise<{
      group_id: string
      sign_pubkey: string
      encrypt_pubkey: string
      type: string
      action: string
      sign: string
      trx_id: string
    }>;
  },
  fetchAnnouncedProducers(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAnnouncedGroupProducers(groupId) as Promise<Array<IAnnouncedProducer>>;
    }
    return request(`/api/v1/group/${groupId}/announced/producers`, {
      base: getBase(),
      jwt: true,
    }) as Promise<Array<IAnnouncedProducer>>;
  },
  producer(data: {
    group_id: string
    action: 'add' | 'remove'
    producer_pubkey: string
  }) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GroupProducer(JSON.stringify(data)) as Promise<{
        group_id: string
        producer_pubkey: string
        owner_pubkey: string
        sign: string
        trx_id: string
        memo: string
        action: string
      }>;
    }
    return request('/api/v1/group/producer', {
      method: 'POST',
      base: getBase(),
      body: data,
      jwt: true,
    }) as Promise<{
      group_id: string
      producer_pubkey: string
      owner_pubkey: string
      sign: string
      trx_id: string
      memo: string
      action: string
    }>;
  },
  fetchApprovedProducers(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetGroupProducers(groupId) as Promise<Array<IApprovedProducer>>;
    }
    return request(`/api/v1/group/${groupId}/producers`, {
      base: getBase(),
      jwt: true,
    }) as Promise<Array<IApprovedProducer>>;
  },
};

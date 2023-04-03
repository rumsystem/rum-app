import { getClient } from './client';

export type {
  IAnnouncedProducer,
  IApprovedProducer,
} from 'rum-fullnode-sdk/dist/apis/producer';

export default {
  announce(data: {
    group_id: string
    action: 'add' | 'remove'
    type: 'producer'
    memo: string
  }) {
    return getClient().Producer.announce(data);
  },
  fetchAnnouncedProducers(groupId: string) {
    return getClient().Producer.listAnnouncedProducers(groupId);
  },
  producer(data: {
    group_id: string
    action: 'add' | 'remove'
    producer_pubkey: string
  }) {
    return getClient().Producer.declare(data);
  },
  fetchApprovedProducers(groupId: string) {
    return getClient().Producer.listApprovedProducers(groupId);
  },
};

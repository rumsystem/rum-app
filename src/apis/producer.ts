import { qwasm } from 'utils/quorum-wasm/load-quorum';
import { getClient } from './client';
import type {
  IAnnounceProducerRes,
  IAnnouncedProducer,
  IDeclareProducerRes,
  IApprovedProducer,
} from 'rum-fullnode-sdk/dist/apis/producer';

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
    if (!process.env.IS_ELECTRON) {
      return qwasm.Announce(JSON.stringify(data)) as Promise<IAnnounceProducerRes>;
    }
    return getClient().Producer.announce(data);
  },
  fetchAnnouncedProducers(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAnnouncedGroupProducers(groupId) as Promise<Array<IAnnouncedProducer>>;
    }
    return getClient().Producer.listAnnouncedProducers(groupId);
  },
  producer(data: {
    group_id: string
    action: 'add' | 'remove'
    producer_pubkey: string
  }) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GroupProducer(JSON.stringify(data)) as Promise<IDeclareProducerRes>;
    }
    return getClient().Producer.declare(data);
  },
  fetchApprovedProducers(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetGroupProducers(groupId) as Promise<Array<IApprovedProducer>>;
    }
    return getClient().Producer.listApprovedProducers(groupId);
  },
};

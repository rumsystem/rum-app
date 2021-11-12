import request from '../request';
import qs from 'query-string';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

export interface IGetGroupsResult {
  groups: Array<IGroup> | null
}

export enum GroupStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SYNC_FAILED = 'SYNC_FAILED',
}

export interface IGroup {
  owner_pubkey: string
  group_id: string
  group_name: string
  user_pubkey: string
  consensus_type: string
  encryption_type: string
  cipher_key: string
  app_key: GROUP_TEMPLATE_TYPE
  last_updated: number
  highest_height: number
  highest_block_id: string
  group_status: GroupStatus
}

export interface ICreateGroupsResult {
  genesis_block: IGenesisBlock
  group_id: string
  group_name: string
  owner_pubkey: string
  owner_encryptpubkey: string
  consensus_type: string
  encryption_type: string
  cipher_key: string
  app_key: string
  signature: string
}


export interface IGenesisBlock {
  BlockId: string
  GroupId: string
  ProducerPubKey: string
  Hash: string
  Signature: string
  Timestamp: number
}

export interface IGroupResult {
  group_id: string
  signature: string
}

export enum ContentTypeUrl {
  Object = 'quorum.pb.Object',
  Person = 'quorum.pb.Person',
  Vote = 'quorum.pb.Vote',
}

export type IContentItem = IObjectItem | IPersonItem | IVoteItem;

export interface IContentItemBasic {
  TrxId: string
  Publisher: string
  TypeUrl: string
  TimeStamp: number
}

export interface IObjectItem extends IContentItemBasic {
  Content: IObject
}

export interface IObject {
  type: string
  content: string
  name?: string
  inreplyto?: {
    trxid: string
  }
}

export interface IWalletItem {
  id: string
  type: string
  name: string
}

export interface IPersonItem extends IContentItemBasic {
  Content: IPerson
}

export interface IPerson {
  name: string
  image?: {
    mediaType: string
    content: string
  }
  wallet?: Array<IWalletItem>
}


export interface IVoteItem extends IContentItemBasic {
  Content: IVote
}

export interface IVote {
  type: IVoteType
  objectTrxId: string
  objectType: IVoteObjectType
}

export enum IVoteType {
  up = 'up',
  down = 'down',
}

export enum IVoteObjectType {
  object = 'object',
  comment = 'comment',
}

interface IContentPayload {
  type: string
  object: IObject
  target: {
    id: string
    type: string
  }
}

export interface IProfilePayload {
  type: string
  person: IPerson
  target: {
    id: string
    type: string
  }
}

export interface IPostContentResult {
  trx_id: string
}

export interface IDeleteGroupResult extends IGroupResult {
  owner_pubkey: string
}

export interface INodeInfo {
  node_id: string
  node_publickey: string
  node_status: string
  node_version: string
  peers: Record<string, string[]>
}

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

const getBase = () =>
  `https://${(window as any).store.nodeStore.apiConfig.host || '127.0.0.1'}:${
    (window as any).store.nodeStore.apiConfig.port
  }`;

export default {
  createGroup(params: {
    groupName: string
    consensusType: string
    encryptionType: string
    groupType: string
  }) {
    return request('/api/v1/group', {
      method: 'POST',
      base: getBase(),
      minPendingDuration: 500,
      body: {
        group_name: params.groupName,
        consensus_type: params.consensusType,
        encryption_type: params.encryptionType,
        app_key: params.groupType,
      },
      jwt: true,
    }) as Promise<ICreateGroupsResult>;
  },
  deleteGroup(groupId: string) {
    return request('/api/v1/group', {
      method: 'DELETE',
      base: getBase(),
      body: { group_id: groupId },
      jwt: true,
    }) as Promise<IDeleteGroupResult>;
  },
  fetchMyGroups() {
    return request('/api/v1/groups', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<IGetGroupsResult>;
  },
  joinGroup(data: ICreateGroupsResult) {
    return request('/api/v1/group/join', {
      method: 'POST',
      base: getBase(),
      body: data,
      jwt: true,
    }) as Promise<IGroupResult>;
  },
  leaveGroup(groupId: string) {
    return request('/api/v1/group/leave', {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
      jwt: true,
    }) as Promise<IGroupResult>;
  },
  clearGroup(groupId: string) {
    return request('/api/v1/group/clear', {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
      jwt: true,
    }) as Promise<IGroupResult>;
  },
  fetchContents(
    groupId: string,
    options: {
      num: number
      starttrx?: string
      reverse?: boolean
    },
  ) {
    return request(
      `/app/api/v1/group/${groupId}/content?${qs.stringify(options)}`,
      {
        method: 'POST',
        base: getBase(),
        body: { senders: [] },
        jwt: true,
      },
    ) as Promise<null | Array<IContentItem>>;
  },
  postContent(content: IContentPayload) {
    return request('/api/v1/group/content', {
      method: 'POST',
      base: getBase(),
      body: content,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
  updateProfile(profile: IProfilePayload) {
    return request('/api/v1/group/profile', {
      method: 'POST',
      base: getBase(),
      body: profile,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
  fetchMyNodeInfo() {
    return request('/api/v1/node', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<INodeInfo>;
  },
  fetchNetwork() {
    return request('/api/v1/network', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<INetwork>;
  },
  fetchTrx(GroupId: string, TrxId: string) {
    return request(`/api/v1/trx/${GroupId}/${TrxId}`, {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<ITrx>;
  },
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
    }) as Promise<IPostContentResult>;
  },
  syncGroup(groupId: string) {
    return request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
      jwt: true,
    })!;
  },
  announce(data: {
    group_id: string
    action: 'add' | 'remove'
    type: 'producer'
    memo: string
  }) {
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
    return request(`/api/v1/group/${groupId}/producers`, {
      base: getBase(),
      jwt: true,
    }) as Promise<Array<IApprovedProducer>>;
  },
};

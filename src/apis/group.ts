import request from '../request';
import qs from 'query-string';

export interface IGetGroupsResult {
  groups: Array<IGroup> | null
}

export enum GroupStatus {
  GROUP_READY = 'GROUP_READY',
  GROUP_SYNCING = 'GROUP_SYNCING',
}

export interface IGroup {
  owner_pubkey: string
  group_id: string
  group_name: string
  user_pubkey: string
  consensus_type: string
  encryption_type: string
  cipher_key: string
  app_key: string
  last_updated: number
  highest_height: number
  highest_block_id: string[]
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
  Sender: string
  Pubkey: string
  Data: string
  TimeStamp: number
  Version: string
  Expired: number
  Signature: string
}

export interface IBlackListPayload {
  type: string
  object: {
    type: string
    id: string
  }
  target: {
    id: string
    type: string
  }
}

export type Blacklist = IBlocked[];

interface BlacklistRes {
  blocked: Blacklist
}

interface IBlocked {
  GroupId: string
  Memo: string
  OwnerPubkey: string
  OwnerSign: string
  TimeStamp: number
  UserId: string
}

export interface INetworkGroup {
  GroupId: string
  GroupName: string
  Peers: string[] | null
}

export interface INetwork {
  groups: INetworkGroup[] | null
  node: {
    addrs: string[]
    ethaddr: string
    nat_enabled: boolean
    nat_type: string
    peerid: string
  }
}

const getBase = () =>
  `https://${(window as any).store.nodeStore.apiHost}:${
    (window as any).store.nodeStore.port
  }`;

export default {
  createGroup(groupName: string) {
    return request('/api/v1/group', {
      method: 'POST',
      base: getBase(),
      minPendingDuration: 500,
      body: {
        group_name: groupName,
        consensus_type: 'poa', // FIXME: hardcode
        encryption_type: 'public', // FIXME: hardcode
        app_key: 'group_timeline', // FIXME: hardcode
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
  fetchTrx(TrxId: string) {
    return request(`/api/v1/trx/${TrxId}`, {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<ITrx>;
  },
  fetchBlacklist() {
    return request('/api/v1/group/blacklist', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<BlacklistRes>;
  },
  createBlacklist(blacklist: IBlackListPayload) {
    return request('/api/v1/group/blacklist', {
      method: 'POST',
      base: getBase(),
      body: blacklist,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
  syncGroup(groupId: string) {
    return Promise.resolve() || request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
      jwt: true,
    })!;
  },
};

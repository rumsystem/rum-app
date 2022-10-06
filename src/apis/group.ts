import request from '../request';
import qs from 'query-string';

export interface IGetGroupsResult {
  groups: Array<IGroup> | null;
}

export enum GroupStatus {
  GROUP_READY = 'GROUP_READY',
  GROUP_SYNCING = 'GROUP_SYNCING',
}

export interface IGroup {
  OwnerPubKey: string;
  GroupId: string;
  GroupName: string;
  LastUpdate: number;
  LatestBlockNum: number;
  LatestBlockId: string;
  GroupStatus: GroupStatus;
}

export interface ICreateGroupsResult {
  genesis_block: IGenesisBlock;
  group_id: string;
  group_name: string;
  owner_pubkey: string;
  signature: string;
}

export interface IGenesisBlock {
  Cid: string;
  GroupId: string;
  PrevBlockId: string;
  BlockNum: number;
  Timestamp: number;
  Hash: string;
  PreviousHash: string;
  Producer: string;
  Signature: string;
  Trxs: null;
}

export interface IGroupResult {
  group_id: string;
  signature: string;
}

export enum ContentTypeUrl {
  Object = 'quorum.pb.Object',
  Person = 'quorum.pb.Person',
  Follow = 'quorum.pb.Follow',
}

export type IContentItem = IObjectItem | IPersonItem;

export interface IObjectItem {
  TrxId: string;
  Publisher: string;
  Content: IObject;
  TypeUrl: string;
  TimeStamp: number;
}

export interface IObject {
  type: string;
  content: string;
}

export interface IPersonItem {
  TrxId: string;
  Publisher: string;
  Content: IPerson;
  TypeUrl: string;
  TimeStamp: number;
}

export interface IPerson {
  name: string;
  image?: {
    mediaType: string;
    content: string;
  };
}

export interface IFollowItem {
  TrxId: string;
  Publisher: string;
  Content: {
    following: string;
  };
  TypeUrl: string;
  TimeStamp: number;
}

interface IContentPayload {
  type: string;
  object: IObject;
  target: {
    id: string;
    type: string;
  };
}

export interface IProfilePayload {
  type: string;
  person: IPerson;
  target: {
    id: string;
    type: string;
  };
}

export interface IPostContentResult {
  trx_id: string;
}

export interface IDeleteGroupResult extends IGroupResult {
  owner_pubkey: string;
}

export interface INodeInfo {
  node_id: string;
  node_publickey: string;
  node_status: string;
  node_version: string;
  peers: {
    [type: string]: string[];
  };
}

export interface ITrx {
  TrxId: string;
  GroupId: string;
  Sender: string;
  Pubkey: string;
  Data: string;
  TimeStamp: number;
  Version: string;
  Expired: number;
  Signature: string;
}

export interface IBlackListPayload {
  type: string;
  object: {
    type: string;
    id: string;
  };
  target: {
    id: string;
    type: string;
  };
}

export type Blacklist = IBlocked[];

type BlacklistRes = {
  blocked: Blacklist;
};

interface IBlocked {
  GroupId: string;
  Memo: string;
  OwnerPubkey: string;
  OwnerSign: string;
  TimeStamp: number;
  UserId: string;
}

export interface INetworkGroup {
  GroupId: string;
  GroupName: string;
  Peers: string[] | null;
}

export interface INetwork {
  groups: INetworkGroup[] | null;
  node: {
    addrs: string[];
    ethaddr: string;
    nat_enabled: boolean;
    nat_type: string;
    peerid: string;
  };
}

const getBase = () =>
  `http://${(window as any).store.nodeStore.apiHost}:${
    (window as any).store.nodeStore.port
  }`;

export default {
  createGroup(groupName: string) {
    return request(`/api/v1/group`, {
      method: 'POST',
      base: getBase(),
      minPendingDuration: 500,
      body: { group_name: groupName },
    }) as Promise<ICreateGroupsResult>;
  },
  deleteGroup(groupId: string) {
    return request(`/api/v1/group`, {
      method: 'DELETE',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<IDeleteGroupResult>;
  },
  fetchMyGroups() {
    return request(`/api/v1/groups`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<IGetGroupsResult>;
  },
  joinGroup(data: ICreateGroupsResult) {
    return request(`/api/v1/group/join`, {
      method: 'POST',
      base: getBase(),
      body: data,
    }) as Promise<IGroupResult>;
  },
  leaveGroup(groupId: string) {
    return request(`/api/v1/group/leave`, {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<IGroupResult>;
  },
  fetchContents(
    groupId: string,
    options: {
      num: number;
      starttrx?: string;
      reverse?: boolean;
    }
  ) {
    return request(
      `/app/api/v1/group/${groupId}/content?${qs.stringify(options)}`,
      {
        method: 'POST',
        base: getBase(),
        body: { senders: [] },
      }
    ) as Promise<null | Array<IContentItem>>;
  },
  postContent(content: IContentPayload) {
    return request(`/api/v1/group/content`, {
      method: 'POST',
      base: getBase(),
      body: content,
    }) as Promise<IPostContentResult>;
  },
  updateProfile(profile: IProfilePayload) {
    return request(`/api/v1/group/profile`, {
      method: 'POST',
      base: getBase(),
      body: profile,
    }) as Promise<IPostContentResult>;
  },
  fetchMyNodeInfo() {
    return request(`/api/v1/node`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<INodeInfo>;
  },
  fetchNetwork() {
    return request(`/api/v1/network`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<INetwork>;
  },
  fetchTrx(TrxId: string) {
    return request(`/api/v1/trx/${TrxId}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<ITrx>;
  },
  fetchBlacklist() {
    return request(`/api/v1/group/blacklist`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<BlacklistRes>;
  },
  createBlacklist(blacklist: IBlackListPayload) {
    return request(`/api/v1/group/blacklist`, {
      method: 'POST',
      base: getBase(),
      body: blacklist,
    }) as Promise<IPostContentResult>;
  },
  syncGroup(groupId: string) {
    return request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
    }) as Promise<any>;
  },
};

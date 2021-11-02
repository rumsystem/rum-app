import request from '../request';

export interface IGetGroupsResult {
  groups: Array<IGroup> | null;
}

export interface IGroup {
  OwnerPubKey: string;
  GroupId: string;
  GroupName: string;
  LastUpdate: number;
  LatestBlockNum: number;
  LatestBlockId: string;
  GroupStatus: 'GROUP_READY' | 'GROUP_SYNCING';
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

export interface IContentItem {
  TrxId: string;
  Publisher: string;
  Content: {
    type: string;
    content: string;
  };
  TimeStamp: number;
}

export interface IPostContentResult {
  trx_id: string;
}

export interface IDeleteGroupResult extends IGroupResult {
  owner_pubkey: string;
}

export interface INodeInfo {
  node_publickey: string;
  node_status: string;
  node_version: string;
  peers: string[];
  user_id: string;
}

interface IContentPayload {
  type: string;
  object: {
    type: string;
    content: string;
    name: string;
  };
  target: {
    id: string;
    type: string;
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

const getBase = () =>
  `http://127.0.0.1:${(window as any).store.nodeStore.port}`;

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
    return request(`/api/v1/group`, {
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
  fetchContents(groupId: string, options: any = {}) {
    return request(`/api/v1/group/content?groupId=${groupId}`, {
      method: 'GET',
      base: getBase(),
      ...options,
    }) as Promise<null | Array<IContentItem>>;
  },
  postContent(content: IContentPayload) {
    return request(`/api/v1/group/content`, {
      method: 'POST',
      base: getBase(),
      body: content,
    }) as Promise<IPostContentResult>;
  },
  fetchMyNodeInfo() {
    return request(`/api/v1/node`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<INodeInfo>;
  },
  fetchTrx(TrxId: string) {
    return request(`/api/v1/trx?TrxId=${TrxId}`, {
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
};

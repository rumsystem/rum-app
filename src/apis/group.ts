import request from '../request';

export interface GetGroupsResult {
  groups: Array<Group> | null;
}

export interface Group {
  OwnerPubKey: string;
  GroupId: string;
  GroupName: string;
  LastUpdate: number;
  LatestBlockNum: number;
  LatestBlockId: string;
  GroupStatus: 'GROUP_READY' | 'GROUP_SYNCING';
}

export interface CreateGroupsResult {
  genesis_block: GenesisBlock;
  group_id: string;
  group_name: string;
  owner_pubkey: string;
  signature: string;
}

export interface GenesisBlock {
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

export interface GroupResult {
  group_id: string;
  signature: string;
}

export interface ContentItem {
  TrxId: string;
  Publisher: string;
  Content: {
    type: string;
    content: string;
  };
  TimeStamp: number;
}

export interface PostContentResult {
  trx_id: string;
}

export interface DeleteGroupResult extends GroupResult {
  owner_pubkey: string;
}

export interface NodeInfo {
  node_publickey: string;
  node_status: string;
  node_version: string;
}

interface ContentPayload {
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

export interface Trx {
  Msg: {
    TrxId: string;
    MsgType: number;
    Sender: string;
    GroupId: string;
    Data: string;
    Version: string;
    TimeStamp: number;
  };
  Data: string;
  Consensus: Array<string>;
}

const getBase = () =>
  `http://127.0.0.1:${(window as any).store.groupStore.nodePort}`;

export default {
  createGroup(groupName: string) {
    return request(`/api/v1/group`, {
      method: 'POST',
      base: getBase(),
      minPendingDuration: 500,
      body: { group_name: groupName },
    }) as Promise<CreateGroupsResult>;
  },
  deleteGroup(groupId: string) {
    return request(`/api/v1/group`, {
      method: 'DELETE',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<DeleteGroupResult>;
  },
  fetchMyGroups() {
    return request(`/api/v1/group`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<GetGroupsResult>;
  },
  joinGroup(data: CreateGroupsResult) {
    return request(`/api/v1/group/join`, {
      method: 'POST',
      base: getBase(),
      body: data,
    }) as Promise<GroupResult>;
  },
  leaveGroup(groupId: string) {
    return request(`/api/v1/group/leave`, {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<GroupResult>;
  },
  fetchContents(groupId: string) {
    return request(`/api/v1/group/content?groupId=${groupId}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<null | Array<ContentItem>>;
  },
  postContent(content: ContentPayload) {
    return request(`/api/v1/group/content`, {
      method: 'POST',
      base: getBase(),
      body: content,
    }) as Promise<PostContentResult>;
  },
  fetchMyNodeInfo() {
    return request(`/api/v1/node`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<NodeInfo>;
  },
  fetchTrx(TrxId: string) {
    return request(`/api/v1/trx?TrxId=${TrxId}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<Trx>;
  },
};

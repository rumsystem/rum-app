import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface IGetGroupsResult {
  groups: Array<IGroup> | null
}

export enum GROUP_TEMPLATE_TYPE {
  TIMELINE = 'group_timeline',
  POST = 'group_post',
  NOTE = 'group_note',
}

export enum GROUP_CONFIG_KEY {
  GROUP_ICON = 'group_icon',
  GROUP_DESC = 'group_desc',
  GROUP_ANNOUNCEMENT = 'group_announcement',
  GROUP_DEFAULT_PERMISSION = 'group_default_permission',
}

export enum GROUP_DEFAULT_PERMISSION {
  READ = 'READ',
  WRITE = 'WRITE',
}

export enum GroupStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SYNC_FAILED = 'SYNC_FAILED',
}

export enum GroupUpdatedStatus {
  ACTIVE = 'ACTIVE',
  RECENTLY = 'RECENTLY',
  SLEEPY = 'SLEEPY',
}

export interface IGroup {
  owner_pubkey: string
  group_id: string
  group_name: string
  user_eth_addr: string
  user_pubkey: string
  consensus_type: string
  encryption_type: 'PUBLIC' | 'PRIVATE'
  cipher_key: string
  app_key: GROUP_TEMPLATE_TYPE
  last_updated: number
  highest_height: number
  highest_block_id: string
  group_status: GroupStatus
  updatedStatus: GroupUpdatedStatus
  role?: string
  profile?: any
  profileTag?: string
  profileStatus?: string
  person?: any
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

export interface IDeleteGroupResult extends IGroupResult {
  owner_pubkey: string
}

export type AppGetAppConfigItemConfigKeyListResult = null | Array<{ Name: string, Type: 'STRING' | 'BOOL' | 'INT' }>;

export interface AppConfigItemResult {
  Name: string
  Type: string
  Value: string
  OwnerPubkey: string
  OwnerSign: string
  Memo: string
  TimeStamp: number
}

export default {
  createGroup(params: {
    group_name: string
    consensus_type: string
    encryption_type: string
    /** group_type */
    app_key: string
  }) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.CreateGroup(JSON.stringify(params)) as Promise<ICreateGroupsResult>;
    }
    return request('/api/v1/group', {
      method: 'POST',
      base: getBase(),
      minPendingDuration: 500,
      body: {
        group_name: params.group_name,
        consensus_type: params.consensus_type,
        encryption_type: params.encryption_type,
        app_key: params.app_key,
      },
    }) as Promise<ICreateGroupsResult>;
  },
  deleteGroup(groupId: string) {
    console.log(groupId);
    throw new Error('not implemented');
    // return request('/api/v1/group', {
    //   method: 'DELETE',
    //   base: getBase(),
    //   body: { group_id: groupId },
    // }) as Promise<IDeleteGroupResult>;
  },
  fetchMyGroups() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetGroups() as Promise<IGetGroupsResult>;
    }
    return request('/api/v1/groups', {
      method: 'GET',
      base: getBase(),
    }) as Promise<IGetGroupsResult>;
  },
  joinGroup(data: ICreateGroupsResult) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.JoinGroup(JSON.stringify(data)) as Promise<IGroupResult>;
    }
    return request('/api/v1/group/join', {
      method: 'POST',
      base: getBase(),
      body: data,
    }) as Promise<IGroupResult>;
  },
  leaveGroup(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.LeaveGroup(groupId) as Promise<IGroupResult>;
    }
    return request('/api/v1/group/leave', {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<IGroupResult>;
  },
  clearGroup(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.ClearGroupData(groupId) as Promise<IGroupResult>;
    }
    return request('/api/v1/group/clear', {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<IGroupResult>;
  },
  syncGroup(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.StartSync(groupId) as Promise<unknown>;
    }
    return request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
    })!;
  },
  fetchSeed(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetGroupSeed(groupId) as Promise<IGetGroupsResult>;
    }
    return request(`/api/v1/group/${groupId}/seed`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<IGetGroupsResult>;
  },
  applyToken() {
    if (!process.env.IS_ELECTRON) {
      throw new Error('not implemented');
    }
    return request('/app/api/v1/token/apply', {
      method: 'POST',
      base: getBase(),
    })!;
  },
  refreshToken() {
    if (!process.env.IS_ELECTRON) {
      throw new Error('not implemented');
    }
    return request('/app/api/v1/token/refresh', {
      method: 'POST',
      base: getBase(),
    })!;
  },
  changeGroupConfig(params: {
    action: 'add' | 'del'
    group_id: string
    name: string
    type: 'int' | 'string' | 'bool'
    value: unknown
    memo?: string
  }) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.MgrAppConfig(JSON.stringify(params)) as Promise<unknown>;
    }
    return request('/api/v1/group/appconfig', {
      method: 'POST',
      base: getBase(),
      body: params,
    })!;
  },
  GetAppConfigKeyList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAppConfigKeyList(groupId) as Promise<AppGetAppConfigItemConfigKeyListResult>;
    }
    return request(`/api/v1/group/${groupId}/appconfig/keylist`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<AppGetAppConfigItemConfigKeyListResult>;
  },
  GetAppConfigItem(groupId: string, key: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAppConfigItem(groupId, key) as Promise<AppConfigItemResult>;
    }
    return request(`/api/v1/group/${groupId}/appconfig/${key}`, {
      method: 'GET',
      base: getBase(),
    }) as Promise<AppConfigItemResult>;
  },
};

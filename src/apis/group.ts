import request from '../request';
import getBase from 'utils/getBase';
import type {
  IGroup as IGroupSDK,
  IJoinGroupRes,
} from 'rum-fullnode-sdk/dist/apis/group';
import { getClient } from './client';

export enum GroupUpdatedStatus {
  ACTIVE = 'ACTIVE',
  RECENTLY = 'RECENTLY',
  SLEEPY = 'SLEEPY',
}

export enum GroupStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SYNC_FAILED = 'SYNC_FAILED',
}

export interface IGroup extends IGroupSDK {
  updatedStatus: GroupUpdatedStatus
  group_status: GroupStatus
}

export interface IListGroupsRes {
  groups: Array<IGroup> | null
}

export interface IGroupResult {
  group_id: string
  signature: string
}

export default {
  createGroup(params: {
    group_name: string
    consensus_type: string
    encryption_type: string
    /** group_type */
    app_key: string
  }) {
    return getClient().Group.create(params);
  },
  deleteGroup(groupId: string) {
    console.log(groupId);
    throw new Error('not implemented');
  },
  fetchMyGroups() {
    return getClient().Group.list() as Promise<IListGroupsRes>;
  },
  joinGroup(seed: string) {
    return request('/api/v1/group/join', {
      method: 'POST',
      base: getBase(),
      body: JSON.parse(seed),
    }) as Promise<IJoinGroupRes>;
  },
  joinGroupV2(seed: string) {
    return getClient().Group.join(seed);
  },
  leaveGroup(groupId: string) {
    return getClient().Group.leave(groupId);
  },
  clearGroup(groupId: string) {
    return request('/api/v1/group/clear', {
      method: 'POST',
      base: getBase(),
      body: { group_id: groupId },
    }) as Promise<IGroupResult>;
  },
  syncGroup(groupId: string) {
    return request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
    })!;
  },
  fetchSeed(groupId: string) {
    return getClient().Group.getSeed(groupId);
  },
  applyToken() {
    return request('/app/api/v1/token/apply', {
      method: 'POST',
      base: getBase(),
    })!;
  },
  refreshToken() {
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
    return getClient().AppConfig.change(params);
  },
  GetAppConfigKeyList(groupId: string) {
    return getClient().AppConfig.getKeyList(groupId);
  },
  GetAppConfigItem(groupId: string, key: string) {
    return getClient().AppConfig.getValueByKey(groupId, key);
  },
};

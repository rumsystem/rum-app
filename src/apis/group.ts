import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';
import type {
  IGroup as IGroupSDK,
  ICreateGroupsRes,
  IGetSeedRes,
  IJoinGroupRes,
  ILeaveGroupRes,
} from 'rum-fullnode-sdk/dist/apis/group';
import type { IGetItemByKey, IGetKeyListRes } from 'rum-fullnode-sdk/dist/apis/appConfig';
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
    if (!process.env.IS_ELECTRON) {
      return qwasm.CreateGroup(JSON.stringify(params)) as Promise<ICreateGroupsRes>;
    }
    return getClient().Group.create(params);
  },
  deleteGroup(groupId: string) {
    console.log(groupId);
    throw new Error('not implemented');
  },
  fetchMyGroups() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetGroups() as Promise<IListGroupsRes>;
    }
    return getClient().Group.list() as Promise<IListGroupsRes>;
  },
  joinGroup(seed: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.JoinGroup(seed) as Promise<IJoinGroupRes>;
    }
    return request('/api/v1/group/join', {
      method: 'POST',
      base: getBase(),
      body: JSON.parse(seed),
    }) as Promise<IJoinGroupRes>;
  },
  joinGroupV2(seed: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.JoinGroup(seed) as Promise<IJoinGroupRes>;
    }
    return getClient().Group.join(seed);
  },
  leaveGroup(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.LeaveGroup(groupId) as Promise<ILeaveGroupRes>;
    }
    return getClient().Group.leave(groupId);
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
      return qwasm.GetGroupSeed(groupId) as Promise<IGetSeedRes>;
    }
    return getClient().Group.getSeed(groupId);
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
    return getClient().AppConfig.change(params);
  },
  GetAppConfigKeyList(groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAppConfigKeyList(groupId) as Promise<IGetKeyListRes>;
    }
    return getClient().AppConfig.getKeyList(groupId);
  },
  GetAppConfigItem(groupId: string, key: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetAppConfigItem(groupId, key) as Promise<IGetItemByKey>;
    }
    return getClient().AppConfig.getValueByKey(groupId, key);
  },
};

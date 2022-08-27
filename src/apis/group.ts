import request from '../request';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import getBase from 'utils/getBase';

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

export interface IDeleteGroupResult extends IGroupResult {
  owner_pubkey: string
}

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
  syncGroup(groupId: string) {
    return request(`/api/v1/group/${groupId}/startsync`, {
      method: 'POST',
      base: getBase(),
      jwt: true,
    })!;
  },
};

import { request, sendRequest } from './request';

export * from './types';

import {
  CreateGroupsResult,
  GetGroupsResult,
  GroupResult,
  PostContentResult,
  ContentItem,
  DeleteGroupResult,
  NodeInfo,
  Trx,
  ContentPayload,
  ProcessStatus,
} from './types';

export const fetchMyGroups = () =>
  request<GetGroupsResult>({
    url: '/api/v1/group',
  });

export const createGroup = (groupName: string) =>
  request<CreateGroupsResult>({
    url: '/api/v1/group',
    method: 'POST',
    data: { group_name: groupName },
  });

export const joinGroup = (data: CreateGroupsResult) =>
  request<GroupResult>({
    url: '/api/v1/group/join',
    method: 'POST',
    data,
  });

export const fetchContents = (groupId: string) =>
  request<null | Array<ContentItem>>({
    url: `/api/v1/group/content?groupId=${groupId}`,
  });

export const postContent = (content: ContentPayload) =>
  request<PostContentResult>({
    url: '/api/v1/group/content',
    method: 'POST',
    data: content,
  });

export const leaveGroup = (groupId: string) =>
  request<GroupResult>({
    url: '/api/v1/group/leave',
    method: 'POST',
    data: { group_id: groupId },
  });

export const deleteGroup = (groupId: string) =>
  request<DeleteGroupResult>({
    url: '/api/v1/group',
    method: 'DELETE',
    data: { group_id: groupId },
  });

export const fetchMyNodeInfo = () =>
  request<NodeInfo>({
    url: '/api/v1/node',
  });

export const fetchTrx = (TrxId: string) =>
  request<Trx>({
    url: `/api/v1/trx?TrxId=${TrxId}`,
  });

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export type UpParam =
  | {
      type: 'process';
      peername: string;
      bootstrapId: string;
    }
  | {
      type: 'forward';
      port: number;
    };

export const up = (param: UpParam) =>
  sendRequest<ProcessStatus>({
    action: 'up',
    param,
  });

export const down = () =>
  sendRequest<ProcessStatus>({
    action: 'down',
  });

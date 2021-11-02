import { request } from './request';

import {
  CreateGroupsResult,
  GetGroupsResult,
  GroupResult,
  PostContentResult,
  ContentItem,
  DeleteGroupResult,
  NodeInfo,
  Trx,
} from './types';

export const getGroups = () => request<GetGroupsResult>({
  url: '/api/v1/group',
});

export const createGroups = (groupName: string) => request<CreateGroupsResult>({
  url: '/api/v1/group',
  method: 'POST',
  data: { group_name: groupName },
});

export const joinGroups = (data: CreateGroupsResult) => request<GroupResult>({
  url: '/api/v1/group/join',
  method: 'POST',
  data,
});

export const getContent = (groupId: string) => request<null | Array<ContentItem>>({
  url: `/api/v1/group/content?groupId=${groupId}`,
});

interface PropsContentParams {
  groupId: string
  content: string
  type: string
  name: string
}
export const postContent = (p: PropsContentParams) => request<PostContentResult>({
  url: '/api/v1/group/content',
  method: 'POST',
  data: {
    type: 'Add',
    object: {
      type: p.type,
      content: p.content,
      name: p.name,
    },
    target: {
      id: p.groupId,
      type: 'Group',
    },
  },
});

export const leaveGroup = (groupId: string) => request<GroupResult>({
  url: '/api/v1/group/leave',
  method: 'POST',
  data: { group_id: groupId },
});

export const deleteGroup = (groupId: string) => request<DeleteGroupResult>({
  url: '/api/v1/group',
  method: 'DELETE',
  data: { group_id: groupId },
});

export const getNodeInfo = () => request<NodeInfo>({
  url: '/api/v1/node',
});

export const getTrx = (TrxId: string) => request<Trx>({
  url: `/api/v1/trx?TrxId=${TrxId}`,
});

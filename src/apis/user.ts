import request from '../request';
import getBase from 'utils/getBase';

export interface IAnnouncedUser {
  AnnouncedEncryptPubkey: string
  AnnouncedSignPubkey: string
  AnnouncerSign: string
  Result: 'ANNOUNCED' | 'APPROVED'
  Memo: string
  TimeStamp: number
}

export default {
  announce(payload: {
    'group_id': string
    'action': 'add' | 'remove'
    'type': 'user'
    'memo': string
  }) {
    return request('/api/v1/group/announce', {
      method: 'POST',
      body: payload,
      base: getBase(),
    });
  },

  fetchAnnouncedUsers(groupId: string) {
    return request(`/api/v1/group/${groupId}/announced/users`, {
      base: getBase(),
    }) as Promise<Array<IAnnouncedUser>>;
  },

  declare(payload: {
    'user_pubkey': string
    'group_id': string
    'action': 'add' | 'remove'
  }) {
    return request('/api/v1/group/user', {
      method: 'POST',
      body: payload,
      base: getBase(),
    });
  },

  fetchUser(groupId: string, publisher: string) {
    return request(`/api/v1/group/${groupId}/announced/user/${publisher}`, {
      base: getBase(),
    }) as Promise<IAnnouncedUser>;
  },
};

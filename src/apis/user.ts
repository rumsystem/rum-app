import { getClient } from './client';

export default {
  announce(payload: {
    'group_id': string
    'action': 'add' | 'remove'
    'type': 'user'
    'memo': string
  }) {
    return getClient().User.announce(payload);
  },

  fetchAnnouncedUsers(groupId: string) {
    return getClient().User.listAnnouncedUsers(groupId);
  },

  declare(payload: {
    'user_pubkey': string
    'group_id': string
    'action': 'add' | 'remove'
  }) {
    return getClient().User.declare(payload);
  },

  fetchUser(groupId: string, publisher: string) {
    return getClient().User.getAnnouncedUser(groupId, publisher);
  },
};

import { Blacklist } from 'apis/group';

interface BlacklistMap {
  [key: string]: boolean;
}

export function createAuthStore() {
  return {
    blacklist: [] as Blacklist,

    get blacklistMap() {
      const map = {} as BlacklistMap;
      for (const blocked of this.blacklist) {
        if (blocked.Memo === 'Add') {
          map[`groupId:${blocked.GroupId}|userId:${blocked.UserId}`] = true;
        } else if (blocked.Memo === 'Remove') {
          map[`groupId:${blocked.GroupId}|userId:${blocked.UserId}`] = false;
        }
      }
      return map;
    },

    setBlackList(blacklist: Blacklist = []) {
      this.blacklist = blacklist;
    },
  };
}

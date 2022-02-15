import { DeniedList } from 'apis/deniedList';
import { isEqual } from 'lodash';

export type DeniedListMap = Record<string, { banned: boolean, reason: string } | undefined>;

export function createAuthStore() {
  return {
    deniedList: [] as DeniedList,

    get deniedListMap() {
      const map = {} as DeniedListMap;
      for (const item of this.deniedList) {
        if (item.Action === 'add') {
          map[`groupId:${item.GroupId}|peerId:${item.PeerId}`] = { banned: true, reason: item.Memo };
        } else if (item.Action === 'del') {
          map[`groupId:${item.GroupId}|peerId:${item.PeerId}`] = { banned: false, reason: item.Memo };
        }
      }
      return map;
    },

    setDeniedList(deniedList: DeniedList = []) {
      if (isEqual(this.deniedList, deniedList)) {
        return;
      }
      this.deniedList = deniedList;
    },
  };
}

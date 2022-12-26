import { DeniedList } from 'apis/deniedList';
import { isEqual } from 'lodash';

export type DeniedListMap = Record<string, boolean>;

export function createAuthStore() {
  return {
    deniedList: [] as DeniedList,

    get deniedListMap() {
      const map = {} as DeniedListMap;
      for (const item of this.deniedList) {
        if (item.Action === 'add') {
          map[`groupId:${item.GroupId}|peerId:${item.PeerId}`] = true;
        } else if (item.Action === 'del') {
          map[`groupId:${item.GroupId}|peerId:${item.PeerId}`] = false;
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

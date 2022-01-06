import Database from 'hooks/useDatabase/database';
import * as LatestStatusModel from 'hooks/useDatabase/models/latestStatus';
import { isEmpty } from 'lodash';


export function createLatestStatusStore() {
  return {
    DEFAULT_LATEST_STATUS: LatestStatusModel.DEFAULT_LATEST_STATUS,

    map: {} as LatestStatusModel.ILatestStatusMap,

    get isEmpty() {
      return isEmpty(this.map);
    },

    async fetchMap(db: Database) {
      this.map = await LatestStatusModel.getLatestStatusMap(db);
    },

    async updateMap(db: Database, groupId: string, data: LatestStatusModel.ILatestStatusPayload) {
      this.map[groupId] = {
        ...this.map[groupId] || this.DEFAULT_LATEST_STATUS,
        ...data,
      };
      await LatestStatusModel.createOrUpdate(db, groupId, data);
    },

    async remove(db: Database, groupId: string) {
      delete this.map[groupId];
      await LatestStatusModel.remove(db, groupId);
    },
  };
}

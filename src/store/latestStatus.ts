import Database from 'hooks/useDatabase/database';
import * as latestStatusModel from 'hooks/useDatabase/models/latestStatus';
import { isEmpty } from 'lodash';


export function createLatestStatusStore() {
  return {
    DEFAULT_LATEST_STATUS: latestStatusModel.DEFAULT_LATEST_STATUS,

    map: {} as latestStatusModel.ILatestStatusMap,

    get isEmpty() {
      return isEmpty(this.map);
    },

    async fetchMap(db: Database) {
      this.map = await latestStatusModel.getLatestStatusMap(db);
    },

    async updateMap(db: Database, groupId: string, data: latestStatusModel.ILatestStatusPayload) {
      this.map[groupId] = {
        ...this.map[groupId] || this.DEFAULT_LATEST_STATUS,
        ...data,
      };
      await latestStatusModel.createOrUpdate(db, groupId, data);
    },

    async remove(db: Database, groupId: string) {
      delete this.map[groupId];
      await latestStatusModel.remove(db, groupId);
    },
  };
}

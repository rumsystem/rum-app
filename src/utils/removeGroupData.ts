import Dexie from 'dexie';
import { find } from 'lodash';
import Database from 'hooks/useDatabase/database';

export default (dbs: Array<Database>, groupId: string) => {
  const dexiePromise: Array<Dexie.Promise> = [];
  dbs.forEach((db) => {
    db.tables.forEach((table) => {
      const index = find(table.schema.indexes, (item) => item.name === 'GroupId');
      if (index) {
        dexiePromise.push(table.where({
          GroupId: groupId,
        }).delete());
      }
    });
  });
  return Promise.all(dexiePromise);
};

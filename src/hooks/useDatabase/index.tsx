import Dexie from 'dexie';
import Database, { getDatabaseName } from './database';

let database = null as Database | null;

export default () => database!;

export const init = async (nodePublickey: string) => {
  if (database) {
    return database;
  }

  const databaseName = getDatabaseName(nodePublickey);
  const exists = await Dexie.exists(databaseName);
  if (!exists) {
    // TODO:
  }
  database = new Database(nodePublickey);
  await database.open();

  return database;
};

import Dexie from 'dexie';
import Database, { getDatabaseName } from './database';

let database = null as Database | null;

export default () => database!;

export const init = async (nodePublickey: string) => {
  if (database) {
    return database;
  }

  database = new Database(nodePublickey);
  await database.open();

  return database;
};

export const exists = async (nodePublickey: string) => {
  const databaseName = getDatabaseName(nodePublickey);
  const exists = await Dexie.exists(databaseName);
  return exists;
};

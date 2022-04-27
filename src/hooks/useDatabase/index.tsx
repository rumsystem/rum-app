import Database from './database';

let database = null as Database | null;

export default () => database!;

export const init = async (nodePublickey: string) => {
  if (!database) {
    database = new Database(nodePublickey);
    await database.open();
  }
  return database;
};

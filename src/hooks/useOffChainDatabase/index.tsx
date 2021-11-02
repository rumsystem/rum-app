import OffChainDatabase from './database';

let database = null as OffChainDatabase | null;

export default () => database!;

export const init = async (nodePublickey: string) => {
  if (!database) {
    database = new OffChainDatabase(nodePublickey);
    await database.open();
  }
  return database;
};

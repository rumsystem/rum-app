import { useStore } from 'store';
import Database from './database';

let database = null as Database | null;

export default () => {
  const { nodeStore } = useStore();
  if (!database) {
    database = new Database(nodeStore.info.node_publickey);
  }
  return database;
};

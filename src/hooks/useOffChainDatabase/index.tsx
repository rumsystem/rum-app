import { useStore } from 'store';
import OffChainDatabase from './database';

let database = null as OffChainDatabase | null;

const useOffChainDatabase = () => {
  const { nodeStore } = useStore();
  if (!database) {
    database = new OffChainDatabase(nodeStore.info.node_publickey);
  }
  return database;
};

export default useOffChainDatabase;

import Dexie from 'dexie';
import { useStore } from 'store';

let database = null as OffChainDatabase | null;

const useOffChainDatabase = () => {
  const { nodeStore } = useStore();
  if (!database) {
    database = new OffChainDatabase(nodeStore.info.node_publickey);
  }
  return database as OffChainDatabase;
};

export default useOffChainDatabase;

export class OffChainDatabase extends Dexie {
  follows: Dexie.Table<IDbFollowItem, number>;

  constructor(nodePublickey: string) {
    super(`OffChainDatabase_${nodePublickey}`);
    this.version(1).stores({
      follows: '++Id, GroupId, Publisher, Following',
    });
    this.follows = this.table('follows');
  }
}

export interface IDbFollowItem {
  Id?: number;
  GroupId: string;
  Publisher: string;
  Following: string;
  TimeStamp: number;
}

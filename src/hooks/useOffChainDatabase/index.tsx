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
  unFollowings: Dexie.Table<IDbUnFollowingItem, number>;

  constructor(nodePublickey: string) {
    super(`OffChainDatabase_${nodePublickey}`);
    this.version(2).stores({
      unFollowings: '++Id, GroupId, Publisher',
    });
    this.unFollowings = this.table('unFollowings');
  }
}

export interface IDbUnFollowingItem {
  Id?: number;
  GroupId: string;
  Publisher: string;
  TimeStamp: number;
}

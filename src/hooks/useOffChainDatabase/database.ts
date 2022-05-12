import Dexie from 'dexie';
import { isStaging } from 'utils/env';

export default class OffChainDatabase extends Dexie {
  followings: Dexie.Table<IDbFollowingItem, number>;
  blockList: Dexie.Table<IDbBlockItem, number>;
  keyValues: Dexie.Table<IDbKeyValue, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}OffChainDatabase_${nodePublickey}`);
    this.version(5).stores({
      followings: '++Id, GroupId, Publisher',
      blockList: '++Id, GroupId, Publisher',
      keyValues: 'key',
    }).upgrade(async (tx) => {
      const unFollowings = await tx.table('unFollowings').toArray();
      await tx.table('blockList').bulkAdd(unFollowings);
    });
    this.followings = this.table('followings');
    this.blockList = this.table('blockList');
    this.keyValues = this.table('keyValues');
  }
}

export interface IDbFollowingItem {
  Id?: number
  GroupId: string
  Publisher: string
  TimeStamp: number
}

export interface IDbBlockItem {
  Id?: number
  GroupId: string
  Publisher: string
  TimeStamp: number
}

export interface IDbKeyValue {
  key: any
  value: any
}

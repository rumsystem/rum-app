import Dexie from 'dexie';
import { isStaging } from 'utils/env';

export default class OffChainDatabase extends Dexie {
  unFollowings: Dexie.Table<IDbUnFollowingItem, number>;
  keyValues: Dexie.Table<IDbKeyValue, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}OffChainDatabase_${nodePublickey}`);
    this.version(3).stores({
      unFollowings: '++Id, GroupId, Publisher',
      keyValues: 'key',
    });
    this.unFollowings = this.table('unFollowings');
    this.keyValues = this.table('keyValues');
  }
}

export interface IDbUnFollowingItem {
  Id?: number
  GroupId: string
  Publisher: string
  TimeStamp: number
}


export interface IDbKeyValue {
  key: any
  value: any
}

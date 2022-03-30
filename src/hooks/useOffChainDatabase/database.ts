import Dexie from 'dexie';
import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';
import crypto from 'crypto';

const ELECTRON_STORE_NAME_PREFIX = isProduction ? `${isStaging ? 'staging_' : ''}` : 'dev_';

export default class OffChainDatabase extends Dexie {
  followings: Dexie.Table<IDbFollowingItem, number>;
  blockList: Dexie.Table<IDbBlockItem, number>;
  keyValues: Dexie.Table<IDbKeyValue, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}OffChainDatabase_${nodePublickey}`);
    this.version(6).stores({
      followings: '++Id, GroupId, Publisher',
      blockList: '++Id, GroupId, Publisher',
      keyValues: 'key',
    }).upgrade(async (tx) => {
      const store = new Store({
        name: ELECTRON_STORE_NAME_PREFIX + crypto.createHash('md5').update(nodePublickey).digest('hex'),
      });
      const followings = await tx.table('followings').toArray();
      const storeFollowings = followings.map((following) => ({
        groupId: following.GroupId,
        publisher: following.Publisher,
        timestamp: following.TimeStamp,
      }));
      console.log({ storeFollowings });
      store.set('followings', storeFollowings);

      const mutedList = await tx.table('blockList').toArray();
      const storeMutedList = mutedList.map((muted) => ({
        groupId: muted.GroupId,
        publisher: muted.Publisher,
        timestamp: muted.TimeStamp,
      }));
      console.log({ storeMutedList });
      store.set('mutedList', storeMutedList);
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

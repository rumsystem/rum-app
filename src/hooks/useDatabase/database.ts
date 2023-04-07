import Dexie from 'dexie';
import type { IDBPostRaw } from './models/posts';
import type { IDBProfileRaw } from './models/profile';
import type { IDBCommentRaw } from './models/comment';
import type { IDBCounter } from './models/counter';
import type { IDBNotificationRaw } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBImage } from './models/image';
import type { IDBRelation } from './models/relations';
import type { IDBRelationSummary } from './models/relationSummaries';
import type { IDBPendingTrx } from './models/pendingTrx';
import type { IDBEmptyTrx } from './models/emptyTrx';
import { isStaging } from 'utils/env';
import { ITransaction } from 'apis/mvm';
import { runPreviousMigrations } from './migrations';

export default class Database extends Dexie {
  posts: Dexie.Table<IDBPostRaw, number>;
  comments: Dexie.Table<IDBCommentRaw, number>;
  counters: Dexie.Table<IDBCounter, number>;
  profiles: Dexie.Table<IDBProfileRaw, number>;
  images: Dexie.Table<IDBImage, number>;
  notifications: Dexie.Table<IDBNotificationRaw, number>;

  summary: Dexie.Table<IDbSummary, number>;
  transfers: Dexie.Table<ITransaction, number>;
  relations: Dexie.Table<IDBRelation, number>;
  relationSummaries: Dexie.Table<IDBRelationSummary, number>;
  pendingTrx: Dexie.Table<IDBPendingTrx, number>;
  emptyTrx: Dexie.Table<IDBEmptyTrx, number>;

  constructor(nodePublickey: string) {
    super(getDatabaseName(nodePublickey));

    runPreviousMigrations(this);

    this.version(2).stores({}).upgrade(async (tx) => {
      // fix timestamp conversion
      const tables = ['posts', 'comments', 'counters', 'profiles', 'images', 'relations', 'emptyTrx', 'notifications'] as const;
      for (const tableName of tables) {
        const table = tx.table(tableName);
        const timestampKey = tableName === 'notifications' ? 'TimeStamp' : 'timestamp';
        const items = await table.toArray();
        for (const item of items) {
          const timestamp = item[timestampKey];
          if (timestamp && timestamp > 10 ** 14) {
            await table
              .where({ groupId: item.groupId, trxId: item.trxId })
              .modify({ [timestampKey]: timestamp / 1000000 });
          }
        }
      }
    });

    this.posts = this.table('posts');
    this.comments = this.table('comments');
    this.counters = this.table('counters');
    this.profiles = this.table('profiles');
    this.images = this.table('images');
    this.notifications = this.table('notifications');
    this.summary = this.table('summary');
    this.transfers = this.table('transfers');
    this.relations = this.table('relations');
    this.relationSummaries = this.table('relationSummaries');
    this.pendingTrx = this.table('pendingTrx');
    this.emptyTrx = this.table('emptyTrx');
  }
}

export const getDatabaseName = (nodePublickey: string) => {
  const version = 'v2_';
  return [
    isStaging ? 'Staging_' : '',
    'Database_',
    version,
    nodePublickey,
  ].join('');
};

(window as any).Database = Database;

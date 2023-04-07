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
import { utils } from 'rum-sdk-browser';

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

    this.version(3).stores({
      posts: [
        '[groupId+id]',
        '[groupId+id+deleted]',
        '[groupId+trxId]',
        '[groupId+trxId+deleted]',
        '[groupId+publisher]',
        '[groupId+publisher+deleted]',
        '[groupId+userAddress]',
        '[groupId+userAddress+deleted]',
        'groupId',
        '[groupId+deleted]',
        '[groupId+timestamp]',
        '[groupId+summary.hotCount]',
      ].join(','),
      comments: [
        '[groupId+id]',
        '[groupId+id+deleted]',
        '[groupId+trxId]',
        '[groupId+trxId+deleted]',
        '[groupId+postId]',
        '[groupId+postId+deleted]',
        '[groupId+publisher]',
        '[groupId+publisher+deleted]',
        '[groupId+userAddress]',
        '[groupId+userAddress+deleted]',
        'groupId',
        '[groupId+postId+timestamp]',
        '[groupId+postId+summary.hotCount]',
      ].join(','),
      counters: [
        '[groupId+trxId]',
        '[groupId+publisher]',
        '[groupId+publisher+objectId]',
        '[groupId+userAddress]',
        '[groupId+userAddress+objectId]',
        'groupId',
      ].join(','),
      profiles: [
        '[groupId+trxId]',
        '[groupId+publisher]',
        '[groupId+userAddress]',
        '[groupId+trxId+timestamp]',
        '[groupId+publisher+timestamp]',
        '[groupId+userAddress+timestamp]',
        'groupId',
        'trxId',
        'publisher',
        'userAddress',
      ].join(','),
      images: [
        '[groupId+id]',
        '[groupId+trxId]',
        'id',
        'trxId',
        'groupId',
        'publisher',
        'userAddress',
      ].join(','),
      notifications: [
        '++Id',
        'GroupId',
        'Type',
        'Status',
        'ObjectTrxId',
        '[GroupId+Status]',
        '[GroupId+Type]',
        '[GroupId+Type+Status]',
      ].join(','),
      summary: [
        '++Id',
        'GroupId',
        'ObjectId',
        'ObjectType',
        'Count',
        '[GroupId+ObjectType]',
        '[GroupId+ObjectType+ObjectId]',
      ].join(','),
      transfers: [
        '++Id',
        'uuid',
        'to',
        'from',
      ].join(','),
      relations: [
        '[groupId+trxId]',
        '[groupId+publisher]',
        '[groupId+type+from+to]',
        'groupId',
      ].join(','),
      relationSummaries: [
        '[groupId+type+from+to]',
        '[groupId+from]',
        '[groupId+to]',
        '[groupId+from+to]',
        '[groupId+type+from]',
        '[groupId+type+to]',
        'groupId',
      ].join(','),
      pendingTrx: [
        '++id',
        '[groupId+trxId]',
        'groupId',
      ].join(','),
      emptyTrx: [
        '[groupId+trxId]',
        'groupId',
      ].join(','),
    }).upgrade(async (tx) => {
      const tables = ['posts', 'comments', 'counters', 'profiles', 'images', 'relations', 'relationSummaries'] as const;
      for (const tableName of tables) {
        const table = tx.table(tableName);
        const items = await table.toArray();
        for (const item of items) {
          try {
            if (tableName === 'relations') {
              await table
                .where({ groupId: item.groupId, trxId: item.trxId })
                .modify({
                  from: utils.pubkeyToAddress(item.from),
                  to: utils.pubkeyToAddress(item.to),
                });
            } else if (tableName === 'relationSummaries') {
              await table
                .where({ groupId: item.groupId, type: item.type, from: item.from, to: item.to })
                .modify({
                  from: utils.pubkeyToAddress(item.from),
                  to: utils.pubkeyToAddress(item.to),
                });
            } else if (!item.userAddress) {
              await table
                .where({ groupId: item.groupId, trxId: item.trxId })
                .modify({ userAddress: utils.pubkeyToAddress(item.publisher) });
            }
          } catch (e) {}
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

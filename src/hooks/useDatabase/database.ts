import Dexie from 'dexie';
import type { IDBPostRaw } from './models/posts';
import type { IDBProfileRaw } from './models/profile';
import type { IDBCommentRaw } from './models/comment';
import type { IDBCounter } from './models/counter';
import type { IDBNotificationRaw } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBImage } from './models/image';
import { isStaging } from 'utils/env';
import { ITransaction } from 'apis/mvm';

export default class Database extends Dexie {
  posts: Dexie.Table<IDBPostRaw, number>;
  comments: Dexie.Table<IDBCommentRaw, number>;
  counters: Dexie.Table<IDBCounter, number>;
  profiles: Dexie.Table<IDBProfileRaw, number>;
  images: Dexie.Table<IDBImage, number>;
  notifications: Dexie.Table<IDBNotificationRaw, number>;

  summary: Dexie.Table<IDbSummary, number>;
  transfers: Dexie.Table<ITransaction, number>;

  constructor(nodePublickey: string) {
    super(getDatabaseName(nodePublickey));

    // runPreviousMigrations(this, nodePublickey);

    this.version(1).stores({
      posts: [
        '[groupId+id]',
        '[groupId+id+deleted]',
        '[groupId+trxId]',
        '[groupId+trxId+deleted]',
        '[groupId+publisher]',
        '[groupId+publisher+deleted]',
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
        'groupId',
        '[groupId+postId+timestamp]',
        '[groupId+postId+summary.hotCount]',
      ].join(','),
      counters: [
        '[groupId+trxId]',
        '[groupId+publisher]',
        '[groupId+publisher+objectId]',
      ].join(','),
      profiles: [
        '[groupId+trxId]',
        '[groupId+publisher]',
        '[groupId+trxId+timestamp]',
        '[groupId+publisher+timestamp]',
        'trxId',
        'publisher',
      ].join(','),
      images: [
        '[groupId+id]',
        '[groupId+trxId]',
        'id',
        'trxId',
        'groupId',
        'publisher',
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
    });

    this.posts = this.table('posts');
    this.comments = this.table('comments');
    this.counters = this.table('counters');
    this.profiles = this.table('profiles');
    this.images = this.table('images');
    this.notifications = this.table('notifications');

    this.summary = this.table('summary');
    this.transfers = this.table('transfers');
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

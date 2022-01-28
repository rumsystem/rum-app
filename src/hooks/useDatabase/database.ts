import Dexie from 'dexie';
import { ContentStatus } from './contentStatus';
import type { IDbObjectItem } from './models/object';
import type { IDbPersonItem } from './models/person';
import type { IDbCommentItem } from './models/comment';
import type { IDbAttributedToItem } from './models/attributedTo';
import type { IDbLikeItem } from './models/like';
import type { IDbNotification } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBLatestStatus } from './models/latestStatus';
import type { IDBGlobalLatestStatus } from './models/globalLatestStatus';
import { isStaging } from 'utils/env';
import { runPreviousMigrations } from './migrations';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  attributedTo: Dexie.Table<IDbAttributedToItem, number>;
  likes: Dexie.Table<IDbLikeItem, number>;
  notifications: Dexie.Table<IDbNotification, number>;
  latestStatus: Dexie.Table<IDBLatestStatus, number>;
  globalLatestStatus: Dexie.Table<IDBGlobalLatestStatus, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}Database_${nodePublickey}`);

    runPreviousMigrations(this);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(29).stores({
      objects: [
        ...contentBasicIndex,
        '[GroupId+Publisher]',
        '[GroupId+Summary.hotCount]',
        'Summary.commentCount',
        'Summary.likeCount',
        'Summary.dislikeCount',
        'Summary.hotCount',
      ].join(','),
      persons: [
        ...contentBasicIndex,
        '[GroupId+Publisher]',
        '[GroupId+Publisher+Status]',
      ].join(','),
      comments: [
        ...contentBasicIndex,
        'Content.objectTrxId',
        'Content.replyTrxId',
        'Content.threadTrxId',
        '[GroupId+Publisher]',
        '[GroupId+Content.objectTrxId]',
        '[Content.threadTrxId+Content.objectTrxId]',
        '[GroupId+Content.objectTrxId+Summary.hotCount]',
        'Summary.commentCount',
        'Summary.likeCount',
        'Summary.dislikeCount',
        'Summary.hotCount',
      ].join(','),
      attributedTo: [
        ...contentBasicIndex,
      ].join(','),
      likes: [
        ...contentBasicIndex,
        'Content.objectTrxId',
        'Content.type',
        '[Publisher+Content.objectTrxId]',
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
      notifications: [
        '++Id',
        'GroupId',
        'Type',
        'Status',
        'ObjectTrxId',
        '[GroupId+Type+Status]',
      ].join(','),
      latestStatus: ['++Id', 'GroupId'].join(','),
      globalLatestStatus: ['++Id'].join(','),
    }).upgrade(async (tx) => {
      try {
        const collection = tx.table('objects').toCollection().filter((object) => 'attributedTo' in object.Content);
        const attributedToItems = await collection.toArray();
        await collection.delete();
        await tx.table('attributedTo').bulkAdd(attributedToItems);
      } catch (e) {
        console.log(e);
      }
    });

    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
    this.attributedTo = this.table('attributedTo');
    this.likes = this.table('likes');
    this.notifications = this.table('notifications');
    this.latestStatus = this.table('latestStatus');
    this.globalLatestStatus = this.table('globalLatestStatus');
  }
}

(window as any).Database = Database;

export interface IDbExtra {
  Id?: number
  GroupId: string
  Status: ContentStatus
}

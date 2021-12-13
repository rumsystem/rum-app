import Dexie from 'dexie';
import { ContentStatus } from './contentStatus';
import type { IDbObjectItem } from './models/object';
import type { IDbPersonItem } from './models/person';
import type { IDbCommentItem } from './models/comment';
import type { IDbLikeItem } from './models/like';
import type { IDbNotification } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBLatestStatus } from './models/latestStatus';
import type { IDBGlobalLatestStatus } from './models/globalLatestStatus';
import { isStaging } from 'utils/env';
import { groupBy } from 'lodash';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  likes: Dexie.Table<IDbLikeItem, number>;
  notifications: Dexie.Table<IDbNotification, number>;
  latestStatus: Dexie.Table<IDBLatestStatus, number>;
  globalLatestStatus: Dexie.Table<IDBGlobalLatestStatus, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}Database_${nodePublickey}`);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(11).stores({
      objects: [
        ...contentBasicIndex,
        'commentCount',
        '[GroupId+Publisher]',
      ].join(','),
      persons: [
        ...contentBasicIndex,
        '[GroupId+Publisher]',
        '[GroupId+Publisher+Status]',
      ].join(','),
      comments: [
        ...contentBasicIndex,
        'commentCount',
        'Content.objectTrxId',
        'Content.replyTrxId',
        'Content.threadTrxId',
        '[GroupId+Publisher]',
        '[GroupId+Content.objectTrxId]',
        '[Content.threadTrxId+Content.objectTrxId]',
      ].join(','),
      votes: [
        ...contentBasicIndex,
        'Content.type',
        'Content.objectTrxId',
        'Content.objectType',
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
      const comments = await tx.table('comments').toArray();
      const groupedComments = groupBy(comments, (comment) => comment.Content.objectTrxId);
      const objectTrxIds = Object.keys(groupedComments);
      const objects = await tx.table('objects').where('TrxId').anyOf(objectTrxIds).toArray();
      const objectsToPut = objects.map((object) => ({
        ...object,
        commentCount: groupedComments[object.TrxId].length,
      }));
      await tx.table('objects').bulkPut(objectsToPut);
    });

    this.version(16).stores({
      objects: [
        ...contentBasicIndex,
        'commentCount',
        'likeCount',
        '[GroupId+Publisher]',
      ].join(','),
      persons: [
        ...contentBasicIndex,
        '[GroupId+Publisher]',
        '[GroupId+Publisher+Status]',
      ].join(','),
      comments: [
        ...contentBasicIndex,
        'commentCount',
        'likeCount',
        'Content.objectTrxId',
        'Content.replyTrxId',
        'Content.threadTrxId',
        '[GroupId+Publisher]',
        '[GroupId+Content.objectTrxId]',
        '[Content.threadTrxId+Content.objectTrxId]',
      ].join(','),
      likes: [
        ...contentBasicIndex,
        'Content.objectTrxId',
        'Content.type',
        '[Publisher+Content.objectTrxId+Content.type]',
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
      await tx.table('notifications').toCollection().delete();
      const latestStatusList = await tx.table('latestStatus').toArray();
      const latestStatusListToPut = latestStatusList.map((item) => {
        item.Status.notificationUnreadCountMap = {};
        return item;
      });
      if (latestStatusListToPut.length > 0) {
        await tx.table('latestStatus').bulkPut(latestStatusListToPut);
      }
    });


    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
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

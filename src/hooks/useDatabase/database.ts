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
import { getHotCount } from './models/utils';
import { runPreviousMigrations } from './migrations';

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

    runPreviousMigrations(this);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(25).stores({
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
        const objects = await tx.table('objects').toArray();
        const newObjects = objects.map((object) => {
          const hotCount = getHotCount({
            likeCount: Math.max(object.likeCount || 0, 0),
            dislikeCount: Math.max(object.dislikeCount || 0, 0),
            commentCount: Math.max(object.commentCount || 0, 0),
          });
          object.Summary = {
            hotCount,
            commentCount: Math.max(object.commentCount || 0, 0),
            likeCount: Math.max(object.likeCount || 0, 0),
            dislikeCount: Math.max(object.dislikeCount || 0, 0),
          };
          return object;
        });
        await tx.table('objects').bulkPut(newObjects);

        const comments = await tx.table('comments').toArray();
        const newComments = comments.map((comment) => {
          const hotCount = getHotCount({
            likeCount: Math.max(comment.likeCount || 0, 0),
            dislikeCount: Math.max(comment.dislikeCount || 0, 0),
            commentCount: Math.max(comment.commentCount || 0, 0),
          });
          comment.Summary = {
            hotCount,
            commentCount: Math.max(comment.commentCount || 0, 0),
            likeCount: Math.max(comment.likeCount || 0, 0),
            dislikeCount: Math.max(comment.dislikeCount || 0, 0),
          };
          return comment;
        });
        await tx.table('comments').bulkPut(newComments);
      } catch (e) {
        console.log(e);
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

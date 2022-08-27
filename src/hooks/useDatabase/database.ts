import Dexie from 'dexie';
import { ContentStatus } from './contentStatus';
import type { IDbObjectItem } from './models/object';
import type { IDbPersonItem } from './models/person';
import type { IDbCommentItem } from './models/comment';
import type { IDbAttributedToItem } from './models/attributedTo';
import type { IDbLikeItem } from './models/like';
import type { IDbNotification } from './models/notification';
import type { IDbSummary } from './models/summary';
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

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}Database_${nodePublickey}`);

    runPreviousMigrations(this, nodePublickey);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(32).stores({
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
    }).upgrade(async (tx) => {
      try {
        await removeDuplicatedData(tx.table('objects'));
        await removeDuplicatedData(tx.table('persons'));
        await removeDuplicatedData(tx.table('comments'));
        await removeDuplicatedData(tx.table('likes'));
        await removeDuplicatedData(tx.table('attributedTo'));
      } catch (e) {
        console.log(e);
      }
    });

    async function removeDuplicatedData(table: any) {
      try {
        const items = await table.toArray();
        const trxIdSet = new Set();
        const removedIds = [];
        for (const item of items) {
          if (trxIdSet.has(item.TrxId)) {
            removedIds.push(item.Id);
          } else {
            trxIdSet.add(item.TrxId);
          }
        }
        console.log({
          items,
          removedIds,
        });
        await table.where('Id').anyOf(removedIds).delete();
      } catch (e) {
        console.log(e);
      }
    }

    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
    this.attributedTo = this.table('attributedTo');
    this.likes = this.table('likes');
    this.notifications = this.table('notifications');
  }
}

(window as any).Database = Database;

export interface IDbExtra {
  Id?: number
  GroupId: string
  Status: ContentStatus
}

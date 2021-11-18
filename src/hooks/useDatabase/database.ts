import Dexie from 'dexie';
import { ContentStatus } from './contentStatus';
import type { IDbContentItem } from './models/content';
import type { IDbObjectItem } from './models/object';
import type { IDbPersonItem } from './models/person';
import type { IDbCommentItem } from './models/comment';
import type { IDbVoteItem } from './models/vote';
import type { IDbNotification } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBLatestStatus } from './models/latestStatus';
import type { IDBGlobalLatestStatus } from './models/globalLatestStatus';
import { isStaging } from 'utils/env';

export default class Database extends Dexie {
  contents: Dexie.Table<IDbContentItem, number>;
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  votes: Dexie.Table<IDbVoteItem, number>;
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

    this.version(12).stores({
      contents: [
        ...contentBasicIndex,
        'TypeUrl',
        'fetchAt',
        '[TypeUrl+fetchAt]',
      ].join(','),
      objects: [
        ...contentBasicIndex,
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
    });

    this.contents = this.table('contents');
    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
    this.votes = this.table('votes');
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
  Replaced?: string
}

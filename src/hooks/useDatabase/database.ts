import Dexie from 'dexie';
import { ContentStatus } from './contentStatus';
import type { IDbObjectItem } from './models/object';
import type { IDbPersonItem } from './models/person';
import type { IDbCommentItem } from './models/comment';
import type { IDbVoteItem } from './models/vote';
import type { IDbNotification } from './models/notification';
import type { IDbSummary } from './models/summary';
import type { IDBLatestStatus } from './models/latestStatus';
import { groupBy } from 'lodash';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  votes: Dexie.Table<IDbVoteItem, number>;
  notifications: Dexie.Table<IDbNotification, number>;
  latestStatus: Dexie.Table<IDBLatestStatus, number>;

  constructor(nodePublickey: string) {
    super(`Database_${nodePublickey}`);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(6).stores({
      objects: contentBasicIndex.join(','),
      persons: contentBasicIndex.join(','),
      comments: [
        ...contentBasicIndex,
        'Content.objectTrxId',
        'Content.replyTrxId',
        'Content.threadTrxId',
      ].join(','),
      votes: [
        ...contentBasicIndex,
        'Content.type',
        'Content.objectTrxId',
        'Content.objectType',
      ].join(','),
      summary: ['++Id', 'GroupId', 'ObjectId', 'ObjectType', 'Count'].join(','),
      notifications: ['++Id', 'GroupId', 'Type', 'Status', 'ObjectTrxId'].join(','),
      latestStatus: ['++Id', 'GroupId'].join(','),
    }).upgrade(async (tx) => {
      const persons = await tx.table('persons').toArray();
      const groupedPerson = groupBy(persons, 'Publisher');
      for (const person of persons) {
        const groupPersons = groupedPerson[person.Publisher];
        if (groupPersons) {
          const latestPerson = groupPersons[groupPersons.length - 1];
          if (latestPerson.Id !== person.Id) {
            await tx.table('persons').where({
              Id: person.Id,
            }).modify({
              Status: ContentStatus.replaced,
            });
          }
        }
      }
    });

    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
    this.votes = this.table('votes');
    this.notifications = this.table('notifications');
    this.latestStatus = this.table('latestStatus');
  }
}

(window as any).Database = Database;

export interface IDbExtra {
  Id?: number
  GroupId: string
  Status: ContentStatus
  Replaced?: string
}

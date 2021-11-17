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
import { isStaging } from 'utils/env';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  votes: Dexie.Table<IDbVoteItem, number>;
  notifications: Dexie.Table<IDbNotification, number>;
  latestStatus: Dexie.Table<IDBLatestStatus, number>;

  constructor(nodePublickey: string) {
    super(`${isStaging ? 'Staging_' : ''}Database_${nodePublickey}`);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(10).stores({
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
    }).upgrade(async (tx) => {
      const persons = await tx.table('persons').toArray();
      const groupedPerson = groupBy(persons, (person) => `${person.GroupId}${person.Publisher}`);
      for (const person of persons) {
        const groupPersons = groupedPerson[`${person.GroupId}${person.Publisher}`];
        if (groupPersons) {
          const latestPerson = groupPersons[groupPersons.length - 1];
          await tx.table('persons').where({
            Id: person.Id,
          }).modify({
            Status: latestPerson.Id === person.Id ? ContentStatus.synced : ContentStatus.replaced,
          });
        }
      }
    }).upgrade(async (tx) => {
      const comments = await tx.table('comments').toArray();
      const groupedComment = groupBy(comments, (comment) => `${comment.GroupId}${comment.Content.objectTrxId}${comment.Content.threadTrxId}`);
      for (const comment of comments) {
        if (comment?.Content?.threadTrxId) {
          await tx.table('comments').where({
            Id: comment.Id,
          }).modify({
            commentCount: 0,
          });
        } else {
          const groupedComments = groupedComment[`${comment.GroupId}${comment.Content.objectTrxId}${comment.TrxId}`];
          await tx.table('comments').where({
            Id: comment.Id,
          }).modify({
            commentCount: groupedComments ? groupedComments.length : 0,
          });
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

import Dexie from 'dexie';
import { useStore } from 'store';
import { IObjectItem, IPersonItem, ICommentItem, IVoteItem } from 'apis/group';
import { IDbNotification } from 'hooks/useDatabase/models/notification';

let database = null as Database | null;

export default () => {
  const { nodeStore } = useStore();
  if (!database) {
    database = new Database(nodeStore.info.node_publickey);
  }
  return database as Database;
};

export class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;
  comments: Dexie.Table<IDbCommentItem, number>;
  votes: Dexie.Table<IDbVoteItem, number>;
  notifications: Dexie.Table<IDbNotification, number>;

  constructor(nodePublickey: string) {
    super(`Database_${nodePublickey}`);

    const contentBasicIndex = [
      '++Id',
      'TrxId',
      'GroupId',
      'Status',
      'Publisher',
    ];

    this.version(2).stores({
      objects: contentBasicIndex.join(','),
      persons: contentBasicIndex.join(','),
      comments: [
        ...contentBasicIndex,
        'Content.objectTrxId',
        'Content.objectType',
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
      notifications: ['++Id', 'GroupId', 'Type', 'Status', 'ObjectTrxId'].join(
        ','
      ),
    });
    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
    this.comments = this.table('comments');
    this.votes = this.table('votes');
    this.notifications = this.table('notifications');
  }
}

(window as any).Database = Database;

export enum ContentStatus {
  synced = 'synced',
  syncing = 'syncing',
}

interface IDbExtra {
  Id?: number;
  GroupId: string;
  Status: ContentStatus;
}

export interface IDbObjectItem extends IObjectItem, IDbExtra {}

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IDbCommentItem extends ICommentItem, IDbExtra {}

export interface IDbVoteItem extends IVoteItem, IDbExtra {}

export interface IDbSummary {
  ObjectId: string;
  ObjectType: SummaryObjectType;
  GroupId: string;
  Count: number;
}

export enum SummaryObjectType {
  publisherObject = 'publisherObject',
  objectComment = 'objectComment',
  objectUpVote = 'objectUpVote',
  CommentUpVote = 'CommentUpVote',
  notificationUnreadObjectLike = 'notificationUnreadObjectLike',
  notificationUnreadCommentLike = 'notificationUnreadCommentLike',
  notificationUnreadCommentObject = 'notificationUnreadCommentObject',
  notificationUnreadCommentReply = 'notificationUnreadCommentReply',
}

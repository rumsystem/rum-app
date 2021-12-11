import Database from 'hooks/useDatabase/database';
import { createDatabaseCache } from '../cache';

export interface IDbSummary {
  ObjectId: string
  ObjectType: SummaryObjectType
  GroupId: string
  Count: number
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

const summaryCache = createDatabaseCache({
  tableName: 'summary',
  optimizedKeys: ['ObjectType'],
});

export const createOrUpdate = async (db: Database, summary: IDbSummary) => {
  const whereQuery = {
    GroupId: summary.GroupId,
    ObjectId: summary.ObjectId,
    ObjectType: summary.ObjectType,
  };
  const existSummary = (await summaryCache.get(db, whereQuery))[0];
  if (existSummary) {
    await db.summary.where(whereQuery).modify({
      Count: summary.Count,
    });
    summaryCache.invalidCache(db);
  } else {
    await summaryCache.add(db, summary);
  }
};

export const getCount = async (
  db: Database,
  whereQuery: {
    ObjectType: string
    ObjectId?: string
    GroupId?: string
  },
) => {
  const summary = (await summaryCache.get(db, whereQuery))[0];
  return summary ? summary.Count : 0;
};

import Database from 'hooks/useDatabase/database';
import { keyBy } from 'lodash';

export interface IDbSummary {
  ObjectId: string
  ObjectType: SummaryObjectType
  GroupId: string
  Count: number
}

export enum SummaryObjectType {
  publisherObject = 'publisherObject',
  commentComment = 'commentComment',
  objectUpVote = 'objectUpVote',
  CommentUpVote = 'CommentUpVote',
  notificationUnreadObjectLike = 'notificationUnreadObjectLike',
  notificationUnreadCommentLike = 'notificationUnreadCommentLike',
  notificationUnreadCommentObject = 'notificationUnreadCommentObject',
  notificationUnreadCommentReply = 'notificationUnreadCommentReply',
  notificationUnreadOther = 'notificationUnreadOther',
}

export const createOrUpdate = async (db: Database, summary: IDbSummary) => {
  const whereQuery = {
    GroupId: summary.GroupId,
    ObjectId: summary.ObjectId,
    ObjectType: summary.ObjectType,
  };
  const existSummary = await db.summary.get(whereQuery);
  if (existSummary) {
    await db.summary.where(whereQuery).modify({
      Count: summary.Count,
    });
  } else {
    await db.summary.add(summary);
  }
};

export const getCount = async (
  db: Database,
  whereQuery: {
    ObjectType: SummaryObjectType
    ObjectId?: string
    GroupId?: string
  },
) => {
  const summary = await db.summary.get(whereQuery);
  return summary ? summary.Count : 0;
};

export const getCounts = async (
  db: Database,
  queries: {
    GroupId: string
    ObjectType: SummaryObjectType
    ObjectId?: string
  }[],
) => {
  const queryArray = queries.map((query) => [
    query.GroupId, query.ObjectType, query.ObjectId || '',
  ]);
  const summaries = await db.summary.where('[GroupId+ObjectType+ObjectId]').anyOf(queryArray).toArray();
  const map = keyBy(summaries, (summary) => `${summary.ObjectType}${summary.ObjectId}`);
  return queries.map((query) => {
    const summary = map[`${query.ObjectType}${query.ObjectId}`];
    return summary ? summary.Count : 0;
  });
};

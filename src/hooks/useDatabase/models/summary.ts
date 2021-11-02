import { Database } from 'hooks/useDatabase';

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

export const createOrUpdate = async (db: Database, summary: IDbSummary) => {
  const whereQuery = {
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
    ObjectType: string;
    ObjectId?: string;
    GroupId?: string;
  }
) => {
  const summary = await db.summary.get(whereQuery);
  return summary ? summary.Count : 0;
};

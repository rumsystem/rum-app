import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as VoteModel from 'hooks/useDatabase/models/vote';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { IVoteObjectType, IContentItemBasic } from 'apis/group';
import { IUser } from './person';

export interface ICommentItem extends IContentItemBasic {
  Content: IComment
}

export interface IComment {
  content: string
  objectTrxId: string
  replyTrxId?: string
  threadTrxId?: string
}


export interface IDbCommentItem extends ICommentItem, IDbExtra {}

export interface IDbDerivedCommentItem extends IDbCommentItem {
  Extra: {
    user: IUser
    upVoteCount: number
    voted: boolean
    replyComment?: IDbDerivedCommentItem
    comments?: IDbDerivedCommentItem[]
    object?: ObjectModel.IDbDerivedObjectItem
  }
}

export const create = async (db: Database, comment: IDbCommentItem) => {
  await db.comments.add(comment);
  await syncSummary(db, comment);
};

export const get = async (
  db: Database,
  options: {
    TrxId: string
    currentPublisher?: string
    withObject?: boolean
  },
) => {
  const comment = await db.comments.get({
    TrxId: options.TrxId,
  });
  if (!comment) {
    return null;
  }
  return packComment(db, comment, {
    withObject: options.withObject,
    currentPublisher: options.currentPublisher,
  });
};

const syncSummary = async (db: Database, comment: IDbCommentItem) => {
  const count = await db.comments
    .where({
      'Content.objectTrxId': comment.Content.objectTrxId,
    })
    .count();
  await SummaryModel.createOrUpdate(db, {
    GroupId: comment.GroupId,
    ObjectId: comment.Content.objectTrxId,
    ObjectType: SummaryModel.SummaryObjectType.objectComment,
    Count: count,
  });
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.comments.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
};

export const list = async (
  db: Database,
  options: {
    GroupId: string
    objectTrxId: string
    limit: number
    offset?: number
    currentPublisher?: string
  },
) => {
  const comments = await db.comments
    .where({
      GroupId: options.GroupId,
      'Content.objectTrxId': options.objectTrxId,
    })
    .offset(options.offset || 0)
    .limit(options.limit)
    .sortBy('TimeStamp');

  if (comments.length === 0) {
    return [];
  }

  const result = await Promise.all(
    comments.map((comment) => packComment(db, comment, {
      withSubComments: true,
      currentPublisher: options.currentPublisher,
    })),
  );

  return result;
};

const packComment = async (
  db: Database,
  comment: IDbCommentItem,
  options: {
    withSubComments?: boolean
    currentPublisher?: string
    withObject?: boolean
  } = {},
) => {
  const [user, upVoteCount, existVote, object] = await Promise.all([
    PersonModel.getUser(db, {
      GroupId: comment.GroupId,
      Publisher: comment.Publisher,
      withObjectCount: true,
    }),
    SummaryModel.getCount(db, {
      ObjectId: comment.TrxId,
      ObjectType: SummaryModel.SummaryObjectType.CommentUpVote,
    }),
    options.currentPublisher
      ? VoteModel.get(db, {
        Publisher: options.currentPublisher,
        objectTrxId: comment.TrxId,
        objectType: IVoteObjectType.comment,
      })
      : Promise.resolve(null),
    options.withObject
      ? ObjectModel.get(db, {
        TrxId: comment.Content.objectTrxId,
      })
      : Promise.resolve(null),
  ]);

  const derivedDbComment = {
    ...comment,
    Extra: {
      user,
      upVoteCount,
      voted: !!existVote,
    },
  } as IDbDerivedCommentItem;

  if (options.withObject) {
    derivedDbComment.Extra.object = object!;
  }

  const { replyTrxId, threadTrxId, objectTrxId } = comment.Content;
  if (replyTrxId && threadTrxId && replyTrxId !== threadTrxId) {
    const replyComment = await db.comments.get({
      TrxId: replyTrxId,
    });
    if (replyComment) {
      derivedDbComment.Extra.replyComment = await packComment(
        db,
        replyComment,
        {
          currentPublisher: options.currentPublisher,
        },
      );
    }
  }

  if (options && options.withSubComments) {
    const subComments = await db.comments
      .where({
        'Content.threadTrxId': objectTrxId,
        'Content.objectTrxId': comment.TrxId,
      })
      .sortBy('TimeStamp');
    if (subComments.length) {
      derivedDbComment.Extra.comments = await Promise.all(
        subComments.map((comment) => packComment(db, comment, {
          currentPublisher: options.currentPublisher,
        })),
      );
    }
  }

  return derivedDbComment;
};

import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { IContentItemBasic } from 'apis/group';

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
    user: PersonModel.IUser
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
    withObject?: boolean
  },
) => {
  const comment = await db.comments.get({
    TrxId: options.TrxId,
  });
  if (!comment) {
    return null;
  }
  const [result] = await packComments(db, [comment], {
    withObject: options.withObject,
  });
  return result;
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
    reverse?: boolean
  },
) => {
  const result = await db.transaction(
    'r',
    [db.comments, db.persons, db.summary, db.objects],
    async () => {
      let comments;
      if (options && options.reverse) {
        comments = await db.comments
          .where({
            GroupId: options.GroupId,
            'Content.objectTrxId': options.objectTrxId,
          })
          .reverse()
          .offset(options.offset || 0)
          .limit(options.limit)
          .sortBy('TimeStamp');
      } else {
        comments = await db.comments
          .where({
            GroupId: options.GroupId,
            'Content.objectTrxId': options.objectTrxId,
          })
          .offset(options.offset || 0)
          .limit(options.limit)
          .sortBy('TimeStamp');
      }

      if (comments.length === 0) {
        return [];
      }

      const result = await packComments(db, comments, {
        withSubComments: true,
        reverse: options.reverse,
      });

      return result;
    },
  );
  return result;
};

const packComments = async (
  db: Database,
  comments: IDbCommentItem[],
  options: {
    withSubComments?: boolean
    withObject?: boolean
    reverse?: boolean
  } = {},
) => {
  const [users, objects] = await Promise.all([
    PersonModel.getUsers(db, comments.map((comment) => ({
      GroupId: comment.GroupId,
      Publisher: comment.Publisher,
    }))),
    options.withObject
      ? ObjectModel.bulkGet(db, comments.map((comment) => comment.Content.objectTrxId))
      : Promise.resolve([]),
  ]);

  console.log({ users, objects });
  const result = await Promise.all(comments.map(async (comment, index) => {
    const user = users[index];
    const object = objects[index];
    const derivedDbComment = {
      ...comment,
      Extra: {
        user,
        upVoteCount: 0,
        voted: false,
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
        const [dbReplyComment] = await packComments(
          db,
          [replyComment],
          {
            withObject: options.withObject,
            reverse: options.reverse,
          },
        );
        derivedDbComment.Extra.replyComment = dbReplyComment;
      }
    }

    if (options && options.withSubComments) {
      let subComments;
      if (options && options.reverse) {
        subComments = await db.comments
          .where({
            'Content.threadTrxId': objectTrxId,
            'Content.objectTrxId': comment.TrxId,
          })
          .reverse()
          .sortBy('TimeStamp');
      } else {
        subComments = await db.comments
          .where({
            'Content.threadTrxId': objectTrxId,
            'Content.objectTrxId': comment.TrxId,
          })
          .sortBy('TimeStamp');
      }
      if (subComments.length) {
        derivedDbComment.Extra.comments = await packComments(
          db,
          subComments,
          {
            withObject: options.withObject,
            reverse: options.reverse,
          },
        );
      }
    }

    return derivedDbComment;
  }));

  return result;
};

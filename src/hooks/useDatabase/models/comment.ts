import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { bulkGetLikeStatus } from 'hooks/useDatabase/models/likeStatus';
import { IContentItemBasic, IImage } from 'apis/content';
import { keyBy, groupBy } from 'lodash';
import getHotCount from './relations/getHotCount';
import Dexie from 'dexie';

export interface IDbCommentItemPayload extends IContentItemBasic, IDbExtra {
  Content: IComment
}

export interface IDbCommentItem extends IDbCommentItemPayload {
  Summary: {
    hotCount: number
    commentCount: number
    likeCount: number
    dislikeCount: number
  }
}

export interface IComment {
  content: string
  image?: IImage[]
  objectTrxId: string
  replyTrxId?: string
  threadTrxId?: string
}

export interface IDbDerivedCommentItem extends IDbCommentItem {
  Extra: {
    user: PersonModel.IUser
    likedCount?: number
    dislikedCount?: number
    replyComment?: IDbDerivedCommentItem
    comments?: IDbDerivedCommentItem[]
    object?: ObjectModel.IDbDerivedObjectItem
  }
}

export const DEFAULT_SUMMARY = {
  hotCount: 0,
  commentCount: 0,
  likeCount: 0,
  dislikeCount: 0,
};

export const bulkAdd = async (db: Database, comments: IDbCommentItemPayload[]) => {
  const _comments = comments.map((comment) => ({
    ...comment,
    Summary: DEFAULT_SUMMARY,
  }));
  await Promise.all([
    db.comments.bulkAdd(_comments),
    syncObjectCommentCount(db, _comments),
    syncCommentCommentCount(db, _comments),
  ]);
};

export const create = async (db: Database, comment: IDbCommentItemPayload) => {
  await bulkAdd(db, [comment]);
};

export const bulkGet = async (db: Database, TrxIds: string[]) => {
  const comments = await db.comments.where('TrxId').anyOf(TrxIds).toArray();
  const map = keyBy(comments, (comment) => comment.TrxId);
  return TrxIds.map((TrxId) => map[TrxId] || null);
};

export const get = async (
  db: Database,
  options: {
    TrxId: string
    raw?: boolean
    withObject?: boolean
    currentPublisher?: string
  },
) => {
  const comment = await db.comments.get({
    TrxId: options.TrxId,
  });
  if (!comment) {
    return null;
  }
  if (options.raw) {
    return comment as IDbDerivedCommentItem;
  }
  const [result] = await packComments(db, [comment], {
    withObject: options.withObject,
    currentPublisher: options.currentPublisher,
  });
  return result;
};

const syncObjectCommentCount = async (db: Database, comments: IDbCommentItem[]) => {
  const groupedComments = groupBy(comments, (comment) => comment.Content.objectTrxId);
  const objects = await ObjectModel.bulkGet(db, Object.keys(groupedComments), { raw: true });
  const bulkObjects = objects.map((object) => {
    const commentCount = (object.Summary.commentCount || 0) + (groupedComments[object.TrxId].length || 0);
    return {
      ...object,
      Summary: {
        ...object.Summary,
        commentCount,
        hotCount: getHotCount({
          likeCount: object.Summary.likeCount || 0,
          dislikeCount: object.Summary.dislikeCount || 0,
          commentCount,
        }),
      },
    };
  });
  await ObjectModel.bulkPut(db, bulkObjects);
};

const syncCommentCommentCount = async (db: Database, comments: IDbCommentItem[]) => {
  const subComments = comments.filter((comment) => !!comment.Content.threadTrxId);
  const groupedSubComments = groupBy(subComments, (comment) => comment.Content.threadTrxId);
  const threadCommentTrxIds = Object.keys(groupedSubComments);
  const threadComments = await bulkGet(db, threadCommentTrxIds);
  const bulkComments = threadComments.map((threadComment) => {
    const commentCount = (threadComment.Summary.commentCount || 0) + (groupedSubComments[threadComment.TrxId].length || 0);
    return {
      ...threadComment,
      Summary: {
        ...threadComment.Summary,
        commentCount,
        hotCount: getHotCount({
          likeCount: threadComment.Summary.likeCount || 0,
          dislikeCount: threadComment.Summary.dislikeCount || 0,
          commentCount,
        }),
      },
    };
  });
  await bulkPut(db, bulkComments);
};

export const bulkPut = async (
  db: Database,
  comments: IDbCommentItem[],
) => {
  await db.comments.bulkPut(comments);
};

export const markedAsSynced = async (
  db: Database,
  TrxIds: string[],
) => {
  await db.comments.where('TrxId').anyOf(TrxIds).modify({
    Status: ContentStatus.synced,
  });
};

export enum Order {
  asc,
  desc,
  hot,
}

export const list = async (
  db: Database,
  options: {
    GroupId: string
    objectTrxId: string
    limit: number
    currentPublisher?: string
    offset?: number
    order?: Order
  },
) => {
  const result = await db.transaction(
    'r',
    [db.comments, db.persons, db.summary, db.objects, db.likes],
    async () => {
      let comments;
      if (options && options.order === Order.desc) {
        comments = await db.comments
          .where({
            GroupId: options.GroupId,
            'Content.objectTrxId': options.objectTrxId,
          })
          .reverse()
          .offset(options.offset || 0)
          .limit(options.limit)
          .sortBy('TimeStamp');
      } else if (options && options.order === Order.hot) {
        comments = await db.comments
          .where('[GroupId+Content.objectTrxId+Summary.hotCount]').between([options.GroupId, options.objectTrxId, Dexie.minKey], [options.GroupId, options.objectTrxId, Dexie.maxKey])
          .reverse()
          .offset(options.offset || 0)
          .limit(options.limit)
          .toArray();
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
        order: options.order,
        currentPublisher: options.currentPublisher,
      });

      return result;
    },
  );
  return result;
};

export const packComments = async (
  db: Database,
  comments: IDbCommentItem[],
  options: {
    withSubComments?: boolean
    withObject?: boolean
    order?: Order
    currentPublisher?: string
  } = {},
) => {
  const [users, objects, likeStatusList] = await Promise.all([
    PersonModel.getUsers(db, comments.map((comment) => ({
      GroupId: comment.GroupId,
      Publisher: comment.Publisher,
    }))),
    options.withObject
      ? ObjectModel.bulkGet(db, comments.map((comment) => comment.Content.objectTrxId))
      : Promise.resolve([]),
    options.currentPublisher ? bulkGetLikeStatus(db, {
      Publisher: options.currentPublisher,
      objectTrxIds: comments.map((comment) => comment.TrxId),
    }) : Promise.resolve([]),
  ]);

  const result = await Promise.all(comments.map(async (comment, index) => {
    const user = users[index];
    const object = objects[index];
    const derivedDbComment = {
      ...comment,
      Extra: {
        user,
      },
    } as IDbDerivedCommentItem;

    if (options.currentPublisher) {
      derivedDbComment.Extra.likedCount = likeStatusList[index].likedCount;
      derivedDbComment.Extra.dislikedCount = likeStatusList[index].dislikedCount;
    }

    if (options.withObject) {
      derivedDbComment.Extra.object = object as ObjectModel.IDbDerivedObjectItem;
    }

    const { replyTrxId, threadTrxId } = comment.Content;
    if (replyTrxId && threadTrxId && replyTrxId !== threadTrxId) {
      const replyComment = await db.comments.get({
        TrxId: replyTrxId,
      });
      if (replyComment) {
        const [dbReplyComment] = await packComments(
          db,
          [replyComment],
          options,
        );
        derivedDbComment.Extra.replyComment = dbReplyComment;
      }
    }

    if (options.withSubComments) {
      const { objectTrxId } = comment.Content;
      let subComments;
      if (options && options.order === Order.desc) {
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
            ...options,
            withSubComments: false,
          },
        );
      }
    }

    return derivedDbComment;
  }));

  return result;
};

export const checkExistForPublisher = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => {
  const comment = await db.comments.get(options);

  return !!comment;
};

export const transferObjectTrxId = async (
  db: Database,
  fromObjectTrxId: string,
  toObjectTrxId: string,
) => {
  await db.comments.where({
    'Content.objectTrxId': fromObjectTrxId,
  }).modify({
    'Content.objectTrxId': toObjectTrxId,
  });
};

import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { IContentItemBasic, LikeType } from 'apis/content';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import { groupBy } from 'lodash';
import getHotCount from './relations/getHotCount';

export interface ILikeItem extends IContentItemBasic {
  Content: ILike
}

export interface ILike {
  objectTrxId: string
  type: LikeType
}

export interface IDbLikeItem extends ILikeItem, IDbExtra {}

export const bulkAdd = async (
  db: Database,
  likes: IDbLikeItem[],
) => {
  await Promise.all([
    db.likes.bulkAdd(likes),
    syncObjectLikeCount(db, likes),
    syncCommentLikeCount(db, likes),
  ]);
};

export const get = async (db: Database, whereOptions: {
  TrxId: string
}) => {
  const like = await db.likes.get(whereOptions);
  return like;
};

export const bulkGet = async (
  db: Database,
  TrxIds: string[],
) => {
  const likes = await db.likes.where('TrxId').anyOf(TrxIds).toArray();
  return likes;
};

export const create = async (db: Database, like: IDbLikeItem) => {
  await bulkAdd(db, [like]);
};

const syncObjectLikeCount = async (db: Database, likes: IDbLikeItem[]) => {
  const groupedLikes = groupBy(likes, (like) => like.Content.objectTrxId);
  const objects = await ObjectModel.bulkGet(db, Object.keys(groupedLikes), { raw: true });
  const bulkObjects = objects.filter((object) => !!object).map((object) => {
    let likeCount = object.Summary.likeCount || 0;
    let dislikeCount = object.Summary.dislikeCount || 0;
    for (const like of groupedLikes[object.TrxId]) {
      if (like.Content.type === LikeType.Like) {
        likeCount += 1;
      } else if (like.Content.type === LikeType.Dislike) {
        dislikeCount += 1;
      }
    }
    return {
      ...object,
      Summary: {
        ...object.Summary,
        likeCount,
        dislikeCount,
        hotCount: getHotCount({
          likeCount,
          dislikeCount,
          commentCount: object.Summary.commentCount || 0,
        }),
      },
    };
  });
  await ObjectModel.bulkPut(db, bulkObjects);
};

const syncCommentLikeCount = async (db: Database, likes: IDbLikeItem[]) => {
  const groupedLikes = groupBy(likes, (like) => like.Content.objectTrxId);
  const comments = await CommentModel.bulkGet(db, Object.keys(groupedLikes));
  const bulkComments = comments.filter((comment) => !!comment).map((comment) => {
    let likeCount = comment.Summary.likeCount || 0;
    let dislikeCount = comment.Summary.dislikeCount || 0;
    for (const like of groupedLikes[comment.TrxId]) {
      if (like.Content.type === LikeType.Like) {
        likeCount += 1;
      } else if (like.Content.type === LikeType.Dislike) {
        dislikeCount += 1;
      }
    }
    return {
      ...comment,
      Summary: {
        ...comment.Summary,
        likeCount,
        dislikeCount,
        hotCount: getHotCount({
          likeCount,
          dislikeCount,
          commentCount: comment.Summary.commentCount || 0,
        }),
      },
    };
  });
  await CommentModel.bulkPut(db, bulkComments);
};

export const bulkPut = async (db: Database, likes: IDbLikeItem[]) => {
  await db.likes.bulkPut(likes);
};

export const transferObjectTrxId = async (
  db: Database,
  fromObjectTrxId: string,
  toObjectTrxId: string,
) => {
  await db.likes.where({
    'Content.objectTrxId': fromObjectTrxId,
  }).modify({
    'Content.objectTrxId': toObjectTrxId,
  });
};

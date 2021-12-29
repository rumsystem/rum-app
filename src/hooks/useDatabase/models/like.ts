import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { IContentItemBasic, LikeType } from 'apis/content';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import { groupBy } from 'lodash';

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
    let likeCount = object.likeCount || 0;
    for (const like of groupedLikes[object.TrxId]) {
      likeCount += like.Content.type === LikeType.Like ? 1 : -1;
    }
    return {
      ...object,
      likeCount,
    };
  });
  await ObjectModel.bulkPut(db, bulkObjects);
};

const syncCommentLikeCount = async (db: Database, likes: IDbLikeItem[]) => {
  const groupedLikes = groupBy(likes, (like) => like.Content.objectTrxId);
  const comments = await CommentModel.bulkGet(db, Object.keys(groupedLikes));
  const bulkComments = comments.filter((comment) => !!comment).map((comment) => {
    let likeCount = comment.likeCount || 0;
    for (const like of groupedLikes[comment.TrxId]) {
      likeCount += like.Content.type === LikeType.Like ? 1 : -1;
    }
    return {
      ...comment,
      likeCount,
    };
  });
  await CommentModel.bulkPut(db, bulkComments);
};

export const bulkPut = async (db: Database, likes: IDbLikeItem[]) => {
  await db.likes.bulkPut(likes);
};

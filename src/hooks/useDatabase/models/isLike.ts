import Database from 'hooks/useDatabase/database';
import { LikeType } from 'apis/content';

export const bulkGetIsLiked = async (
  db: Database,
  options: {
    Publisher: string
    objectTrxIds: string[]
  },
) => {
  const result = await Promise.all(options.objectTrxIds.map((objectTrxId) => isLiked(db, {
    Publisher: options.Publisher,
    objectTrxId,
  })));
  return result;
};

export const isLiked = async (
  db: Database,
  options: {
    Publisher: string
    objectTrxId: string
  },
) => {
  const [likeCount, dislikeCount] = await Promise.all([
    db.likes.where({
      Publisher: options.Publisher,
      'Content.objectTrxId': options.objectTrxId,
      'Content.type': LikeType.Like,
    }).count(),
    db.likes.where({
      Publisher: options.Publisher,
      'Content.objectTrxId': options.objectTrxId,
      'Content.type': LikeType.Dislike,
    }).count(),
  ]);
  return likeCount > dislikeCount;
};

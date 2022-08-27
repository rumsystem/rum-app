import Database from 'hooks/useDatabase/database';
import { LikeType } from 'apis/content';
import { countBy } from 'lodash';

export const bulkGetLikeStatus = async (
  db: Database,
  options: {
    Publisher: string
    objectTrxIds: string[]
  },
) => {
  const likes = await db.likes.where('[Publisher+Content.objectTrxId]').anyOf(options.objectTrxIds.map((trxId) => [
    options.Publisher, trxId,
  ])).toArray();
  const countMap = countBy(likes, (like) => `${like.Content.objectTrxId}_${like.Content.type}`);
  return options.objectTrxIds.map((trxId) => ({
    likedCount: countMap[`${trxId}_${LikeType.Like}`] || 0,
    dislikedCount: countMap[`${trxId}_${LikeType.Dislike}`] || 0,
  }));
};

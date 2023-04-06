import type Database from 'hooks/useDatabase/database';
import { countBy } from 'lodash';
import { IDBCounter } from './counter';

export const bulkGetLikeStatus = async (
  db: Database,
  items: Array<{
    groupId: string
    publisher: string
    objectId: string
  }>,
) => {
  const counters = await db.counters
    .where('[groupId+publisher+objectId]')
    .anyOf(items.map((v) => [
      v.groupId,
      v.publisher,
      v.objectId,
    ]))
    .toArray();
  const countMap: Record<`${string}_${IDBCounter['type']}`, number> = countBy(
    counters,
    (counter) => `${counter.objectId}_${counter.type}`,
  );
  return items.map((v) => {
    const likeCount = countMap[`${v.objectId}_like`] || 0;
    const undoLikeCount = countMap[`${v.objectId}_undolike`] || 0;

    const dislikeCount = countMap[`${v.objectId}_dislike`] || 0;
    const undoDislikeCount = countMap[`${v.objectId}_undodislike`] || 0;

    return {
      likeCount: likeCount - undoLikeCount,
      dislikeCount: dislikeCount - undoDislikeCount,
    };
  });
};

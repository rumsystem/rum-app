import Database from 'hooks/useDatabase/database';
import { ContentStatus } from '../contentStatus';

export interface IDBCounter {
  trxId: string
  groupId: string
  type: 'like' | 'dislike' | 'undolike' | 'undodislike'
  objectType: 'post' | 'comment'
  objectId: string
  publisher: string
  timestamp: number
  status: ContentStatus
}

export const add = async (db: Database, counter: IDBCounter) => {
  await bulkAdd(db, [counter]);
};

export const bulkAdd = async (db: Database, likes: Array<IDBCounter>) => {
  await Promise.all([
    db.counters.bulkAdd(likes),
    // syncObjectLikeCount(db, likes),
    // syncCommentLikeCount(db, likes),
  ]);
};

export const get = async (db: Database, data: { groupId: string, trxId: string }) => {
  const like = await db.counters.get(data);
  return like;
};

export const bulkGet = async (db: Database, data: Array<{ groupId: string, trxId: string }>) => {
  const likes = await db.counters
    .where('[groupId+trxId]')
    .anyOf(data.map((v) => [v.groupId, v.trxId]))
    .toArray();
  return likes;
};

export const put = async (db: Database, likes: IDBCounter) => {
  await bulkPut(db, [likes]);
};

export const bulkPut = async (db: Database, likes: IDBCounter[]) => {
  await db.counters.bulkPut(likes);
};

export const transferObjectTrxId = async (
  db: Database,
  data: {
    groupId: string
    fromObjectTrxId: string
    toObjectTrxId: string
  },
) => {
  await db.counters.where({
    groupId: data.groupId,
    objectId: data.fromObjectTrxId,
  }).modify({
    objectId: data.toObjectTrxId,
  });
};

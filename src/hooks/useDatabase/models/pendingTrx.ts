import type Database from 'hooks/useDatabase/database';
import { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';

export interface IDBPendingTrx {
  id?: number
  groupId: string
  trxId: string
  value: IContentItem
}

export enum Order {
  desc,
  hot,
}

export const DEFAULT_SUMMARY = {
  hotCount: 0,
  commentCount: 0,
  likeCount: 0,
  dislikeCount: 0,
};

export const get = async (db: Database, where: { groupId: string, trxId: string }) => {
  const item = await db.pendingTrx.where(where).first();
  return item;
};

export const getByGroupId = async (db: Database, groupId: string) => {
  const items = await db.pendingTrx.where({ groupId }).toArray();
  return items;
};

export const put = async (db: Database, trx: IDBPendingTrx) => {
  const item = await get(db, { groupId: trx.groupId, trxId: trx.trxId });
  if (item) {
    await db.pendingTrx.put({
      ...trx,
      id: item.id,
    });
  } else {
    await db.pendingTrx.put(trx);
  }
};

export const bulkPut = async (db: Database, trxs: Array<IDBPendingTrx>) => {
  if (!trxs.length) { return; }
  for (const trx of trxs) {
    await put(db, trx);
  }
};

export const del = async (db: Database, where: { groupId: string, trxId: string }) => {
  await db.pendingTrx.where(where).delete();
};

export const bulkDelete = async (db: Database, where: Array<{ groupId: string, trxId: string }>) => {
  if (!where.length) { return; }
  await db.pendingTrx
    .where('[groupId+trxId]')
    .anyOf(where.map((v) => [v.groupId, v.trxId]))
    .delete();
};

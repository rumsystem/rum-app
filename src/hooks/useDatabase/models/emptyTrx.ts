import type Database from 'hooks/useDatabase/database';

export interface IDBEmptyTrx {
  groupId: string
  trxId: string
  timestamp: number
  lastChecked: number
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
  const item = await db.emptyTrx.where(where).first();
  return item;
};

export const getByGroupId = async (db: Database, groupId: string) => {
  const items = await db.emptyTrx.where({ groupId }).toArray();
  return items;
};

export const getAll = async (db: Database) => {
  const items = await db.emptyTrx.toArray();
  return items;
};

export const put = async (db: Database, trx: IDBEmptyTrx) => {
  await db.emptyTrx.put(trx);
};

export const bulkPut = async (db: Database, trxs: Array<IDBEmptyTrx>) => {
  if (!trxs.length) { return; }
  await db.emptyTrx.bulkPut(trxs);
};

export const del = async (db: Database, where: { groupId: string, trxId: string }) => {
  await db.emptyTrx.where(where).delete();
};

export const bulkDelete = async (db: Database, where: Array<{ groupId: string, trxId: string }>) => {
  if (!where.length) { return; }
  await db.emptyTrx
    .where('[groupId+trxId]')
    .anyOf(where.map((v) => [v.groupId, v.trxId]))
    .delete();
};

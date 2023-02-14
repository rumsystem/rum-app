import type Database from 'hooks/useDatabase/database';
import { ContentStatus } from '../contentStatus';

export interface IDBRelation {
  groupId: string
  trxId: string
  type: 'follow' | 'undofollow' | 'block' | 'undoblock'
  from: string
  to: string
  timestamp: number
  publisher: string
  status: ContentStatus
}

export const put = async (db: Database, item: IDBRelation) => {
  await db.relations.put(item);
};

export const bulkPut = async (db: Database, item: Array<IDBRelation>) => {
  await db.relations.bulkPut(item);
};

interface GetParam {
  groupId: string
  trxId: string
}

export const get = async (db: Database, data: GetParam) => {
  const item = await db.relations
    .where('[groupId+trxId]')
    .equals([data.groupId, data.trxId])
    .first();
  return item;
};

export const bulkGet = async (db: Database, data: Array<GetParam>) => {
  const items = await db.relations
    .where('[groupId+trxId]')
    .anyOf(data.map((v) => [v.groupId, v.trxId]))
    .toArray();
  return items;
};

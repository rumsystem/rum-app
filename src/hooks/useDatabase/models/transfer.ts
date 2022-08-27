import Database from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ITransaction } from 'apis/mvm';

export const create = async (db: Database, transfer: ITransaction) => {
  await db.transfers.add(transfer);
  await syncCount(db, transfer.uuid.slice(0, 36));
};

export const bulkCreate = async (db: Database, transfers: Array<ITransaction>) => {
  await db.transfers.bulkAdd(transfers);
  const uuids = Array.from(new Set<string>(transfers.map((transfer) => transfer.uuid.slice(0, 36))));
  await Promise.all(uuids.map((uuid) => syncCount(db, uuid)));
};

const syncCount = async (db: Database, uuid: string) => {
  const count = await db.transfers.where('uuid').startsWith(uuid).count();
  await SummaryModel.createOrUpdate(db, {
    GroupId: '',
    ObjectId: uuid,
    ObjectType: SummaryModel.SummaryObjectType.transferCount,
    Count: count,
  });
};

export const getTransactions = async (
  db: Database,
  uuid: string,
) => {
  const transfers = await db.transfers.where('uuid').startsWith(uuid).toArray();
  return transfers || [];
};

export const getLastTransfer = async (
  db: Database,
) => {
  const transfer = await db.transfers.toCollection().last();
  if (!transfer) {
    return null;
  }
  return transfer;
};

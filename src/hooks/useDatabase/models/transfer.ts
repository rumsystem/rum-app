import Database from 'hooks/useDatabase/database';
import * as TransferCountModel from 'hooks/useDatabase/models/transfersCount';
import { ITransaction } from 'apis/mvm';

export const create = async (db: Database, transfer: ITransaction) => {
  await db.transfers.add(transfer);
  await syncCount(db, transfer.uuid);
};

export const bulkCreate = async (db: Database, transfers: Array<ITransaction>) => {
  await db.transfers.bulkAdd(transfers);
  const uuids = Array.from(new Set<string>(transfers.map((transfer) => transfer.uuid)));
  await Promise.all(uuids.map((uuid) => syncCount(db, uuid)));
};

const syncCount = async (db: Database, uuid: string) => {
  const count = await db.transfers
    .where({
      uuid,
    })
    .count();
  await TransferCountModel.createOrUpdate(db, {
    uuid,
    Count: count,
  });
};

export const get = async (
  db: Database,
  options: {
    uuid: string
  },
) => {
  const transfer = await db.transfers.get({
    uuid: options.uuid,
  });

  if (!transfer) {
    return null;
  }
  return transfer;
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

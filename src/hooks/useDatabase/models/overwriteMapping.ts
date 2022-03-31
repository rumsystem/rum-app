import Database from 'hooks/useDatabase/database';
import { keyBy } from 'lodash';

export interface IDbOverwriteMapping {
  fromTrxId: string
  toTrxId: string
}

export const bulkGet = async (
  db: Database,
  fromTrxIds: string[],
) => {
  const items = await db.overwriteMapping.where('fromTrxId').anyOf(fromTrxIds).toArray();
  const map = keyBy(items, (item) => item.fromTrxId);
  return fromTrxIds.map((TrxId) => map[TrxId] || null);
};

export const bulkPut = async (
  db: Database,
  items: IDbOverwriteMapping[],
) => {
  await db.overwriteMapping.bulkPut(items);
};

export const updateHistoryToTrxId = async (
  db: Database,
  toTrxId: string,
  newToTrxId: string,
) => {
  await db.overwriteMapping.where({
    toTrxId,
  }).modify({
    toTrxId: newToTrxId,
  });
};

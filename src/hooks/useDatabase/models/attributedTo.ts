import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { INoteItem } from 'apis/content';
import { keyBy } from 'lodash';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export interface IDbAttributedToItemPayload extends INoteItem, IDbExtra {}

export interface IDbAttributedToItem extends IDbAttributedToItemPayload {}

export interface IDbDerivedAttributedToItem extends IDbAttributedToItem {}

export const bulkAdd = async (db: Database, attributedToItems: IDbAttributedToItemPayload[]) => {
  await db.attributedTo.bulkAdd(attributedToItems);
};

export const bulkGet = async (db: Database, TrxIds: string[]) => {
  const attributedTo = await db.attributedTo.where('TrxId').anyOf(TrxIds).toArray();
  const map = keyBy(attributedTo, (item) => item.TrxId);
  return TrxIds.map((TrxId) => map[TrxId] || null);
};

export const bulkMarkAsSynced = async (
  db: Database,
  trxIds: Array<string>,
) => {
  await db.attributedTo.where('TrxId').anyOf(trxIds).modify({
    Status: ContentStatus.synced,
  });
};

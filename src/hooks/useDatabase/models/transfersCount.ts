import Database from 'hooks/useDatabase/database';
import { keyBy } from 'lodash';

export interface IDbTransfersCount {
  uuid: string
  Count: number
}

export const createOrUpdate = async (db: Database, transfersCount: IDbTransfersCount) => {
  const whereQuery = {
    uuid: transfersCount.uuid,
  };
  const existTransfersCount = await db.transfersCount.get(whereQuery);
  if (existTransfersCount) {
    await db.transfersCount.where(whereQuery).modify({
      Count: transfersCount.Count,
    });
  } else {
    await db.transfersCount.add(transfersCount);
  }
};

export const getCount = async (
  db: Database,
  whereQuery: {
    uuid: string
  },
) => {
  const transfersCount = await db.transfersCount.get(whereQuery);
  return transfersCount ? transfersCount.Count : 0;
};

export const getCounts = async (
  db: Database,
  queries: {
    uuid: string
  }[],
) => {
  const transfersCounts = await db.transfersCount.where('uuid').anyOf(queries.map((querie) => querie.uuid)).toArray();
  const map = keyBy(transfersCounts, (transfersCount) => transfersCount.uuid);
  return queries.map((query) => {
    const transfersCount = map[query.uuid];
    return transfersCount ? transfersCount.Count : 0;
  });
};

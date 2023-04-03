import type Database from 'hooks/useDatabase/database';

export interface IDBRelationSummary {
  groupId: string
  from: string
  to: string
  type: 'follow' | 'block'
  value: boolean
}

export const put = async (db: Database, item: IDBRelationSummary) => {
  await db.relationSummaries.put(item);
};

export const bulkPut = async (db: Database, item: Array<IDBRelationSummary>) => {
  await db.relationSummaries.bulkPut(item);
};

interface GetParam {
  groupId: string
  from: string
  to: string
}

export const get = async (db: Database, data: GetParam) => {
  const item = await db.relationSummaries
    .where('[from+to]')
    .equals([data.from, data.to])
    .first();
  return item;
};

export const bulkGet = async (db: Database, data: Array<GetParam>) => {
  const items = await db.relationSummaries
    .where('[from+to]')
    .anyOf(data.map((v) => [v.from, v.to]))
    .toArray();
  return items;
};

interface GetByPublisherParam {
  groupId?: string
  type?: IDBRelationSummary['type']
  from?: string
  to?: string
}

export const getByPublisher = async (db: Database, data: GetByPublisherParam) => {
  const paramSize = Object.keys(data).length;
  if (!paramSize) {
    throw new Error('invalid params');
  }
  const where = [
    !!data.groupId && 'groupId',
    !!data.type && 'type',
    !!data.from && 'from',
    !!data.to && 'to',
  ].filter(Boolean).join('+');
  const whereString = paramSize === 1 ? where : `[${where}]`;
  const equals = [
    data.groupId,
    data.type,
    data.from,
    data.to,
  ].filter(<T>(v: T | undefined): v is T => !!v);
  const equalsParam = equals.length === 1 ? equals[0] : equals;

  const items = await db.relationSummaries
    .where(whereString)
    .equals(equalsParam)
    .toArray();

  return items;
};

import Database, { IDbExtra } from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import _getProfile from 'store/selectors/getProfile';
import { IProfile } from 'store/group';
import { IPersonItem } from 'apis/group';
import { keyBy } from 'lodash';

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IUser {
  profile: IProfile
  publisher: string
  objectCount: number
}

export const get = async (db: Database, whereOptions: {
  TrxId: string
}) => {
  const person = await db.persons.get(whereOptions);
  return person;
};

export const bulkGet = async (db: Database, trxIds: Array<string>) => {
  const person = await db.persons.where('TrxId').anyOf(trxIds).toArray();
  const map = Object.fromEntries(person.map((v) => [v.TrxId, v]));
  const results = trxIds.map((v) => map[v] ?? null);
  return results as Array<IDbPersonItem | null>;
};

export const create = async (db: Database, person: IDbPersonItem) => {
  await db.persons.add(person);
  if (person.Status === ContentStatus.synced) {
    updateLatestStatus(db, person);
  }
};

export const bulkCreate = async (db: Database, persons: Array<IDbPersonItem>) => {
  await db.persons.bulkAdd(persons);
  const syncedPersons = persons.filter((v) => v.Status === ContentStatus.synced);
  for (const person of syncedPersons) {
    updateLatestStatus(db, person);
  }
};

export const getUser = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
    nodeId?: string
    withObjectCount?: boolean
    latest?: boolean
  },
) => {
  let person;
  if (options.latest) {
    person = await db.persons
      .where({
        GroupId: options.GroupId,
        Publisher: options.Publisher,
      }).last();
  } else {
    person = await db.persons
      .get({
        GroupId: options.GroupId,
        Publisher: options.Publisher,
        Status: ContentStatus.synced,
      });
  }
  const profile = _getProfile(options.Publisher, person || null);
  const user = {
    profile,
    publisher: options.Publisher,
    objectCount: 0,
  } as IUser;
  if (options.withObjectCount) {
    user.objectCount = await SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectId: options.Publisher,
      ObjectType: SummaryModel.SummaryObjectType.publisherObject,
    });
  }
  return user;
};

export const getLatestProfile = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => {
  const person = await db.persons.where({
    GroupId: options.GroupId,
    Publisher: options.Publisher,
  }).last();
  if (!person) {
    return null;
  }
  const profile = _getProfile(options.Publisher, person);
  const result = {
    profile,
    time: person.TimeStamp,
  };
  return result;
};

export const getUsers = async (
  db: Database,
  queries: {
    GroupId: string
    Publisher: string
  }[],
  options?: {
    withObjectCount?: boolean
  },
) => {
  const queryArray = queries.map((query) => [query.GroupId, query.Publisher, ContentStatus.synced]);
  const persons = await db.persons
    .where('[GroupId+Publisher+Status]').anyOf(queryArray).toArray();
  const map = keyBy(persons, (person) => person.Publisher);
  let objectCounts = [] as number[];
  if (options?.withObjectCount) {
    objectCounts = await SummaryModel.getCounts(db, queries.map((query) => ({
      GroupId: query.GroupId,
      ObjectId: query.Publisher,
      ObjectType: SummaryModel.SummaryObjectType.publisherObject,
    })));
  }
  return queries.map((query, index) => {
    const profile = _getProfile(query.Publisher, map[query.Publisher] || null);
    const user = {
      profile,
      publisher: query.Publisher,
      objectCount: options?.withObjectCount ? objectCounts[index] : 0,
    } as IUser;
    return user;
  });
};

export const getLatestPersonStatus = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => {
  const person = await db.persons
    .where({
      GroupId: options.GroupId,
      Publisher: options.Publisher,
    }).last();
  return person ? person.Status : '' as ContentStatus;
};

export const has = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => !!await db.persons
  .get({
    GroupId: options.GroupId,
    Publisher: options.Publisher,
  });

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.persons.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
  const person = await db.persons.get(whereOptions);
  if (person) {
    updateLatestStatus(db, person);
  }
};

export const bulkMarkedAsSynced = async (
  db: Database,
  trxIds: Array<string>,
) => {
  await db.persons.where('TrxId').anyOf(trxIds).modify({
    Status: ContentStatus.synced,
  });
  const persons = await db.persons.where('TrxId').anyOf(trxIds).toArray();
  await Promise.all(persons.map((person) => updateLatestStatus(db, person)));
};

const updateLatestStatus = async (db: Database, person: IDbPersonItem) => {
  await db.persons.where({
    GroupId: person.GroupId,
    Publisher: person.Publisher,
    Status: ContentStatus.synced,
  }).and((p) => p.Id !== person.Id).modify({
    Status: ContentStatus.replaced,
  });
};

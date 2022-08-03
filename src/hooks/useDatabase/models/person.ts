import Database, { IDbExtra } from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import _getProfile from 'store/selectors/getProfile';
import { IProfile } from 'store/group';
import { IPersonItem } from 'apis/content';
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

export const create = async (db: Database, person: IDbPersonItem) => {
  await bulkPut(db, [person]);
};

export const bulkPut = async (db: Database, persons: IDbPersonItem[]) => {
  await db.persons.bulkPut(persons);
};

export const bulkGetByPublishers = async (db: Database, publishers: string[]) => {
  const persons = await db.persons.where('Publisher').anyOf(publishers).toArray();
  return persons;
};

export const bulkGetByTrxIds = async (db: Database, trxIds: string[]) => {
  const persons = await db.persons.where('TrxId').anyOf(trxIds).toArray();
  return persons;
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
      .where({
        GroupId: options.GroupId,
        Publisher: options.Publisher,
        Status: ContentStatus.synced,
      }).last();
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
};

export const getProfile = _getProfile;

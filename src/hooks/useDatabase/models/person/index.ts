import Database from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import _getProfile from 'store/selectors/getProfile';
import { get as getFromCache, invalidCache } from './cache';
import { IDbPersonItem, IUser } from './types';

export const get = async (db: Database, whereOptions: {
  TrxId: string
}) => {
  // const person = await db.persons.get(whereOptions);
  // return person;
  const persons = await getFromCache(db, whereOptions);
  return persons[0];
};

export const create = async (db: Database, person: IDbPersonItem) => {
  await db.persons.add(person);
  // TODO: refactor later
  invalidCache();
  if (person.Status === ContentStatus.synced) {
    updateLatestStatus(db, person);
  }
};

export const getUser = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
    withObjectCount?: boolean
    latest?: boolean
  },
) => {
  let person;
  // if (options.latest) {
  //   person = await db.persons
  //     .where({
  //       GroupId: options.GroupId,
  //       Publisher: options.Publisher,
  //     }).last();
  // } else {
  //   person = await db.persons
  //     .get({
  //       GroupId: options.GroupId,
  //       Publisher: options.Publisher,
  //       Status: ContentStatus.synced,
  //     });
  // }
  // TODO: refactor later
  const persons = await getFromCache(db, {
    GroupId: options.GroupId,
    Publisher: options.Publisher,
  });
  if (options.latest) {
    person = persons[persons.length - 1];
  } else {
    person = persons[0];
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

export const getLatestPersonStatus = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => {
  // const person = await db.persons
  //   .where({
  //     GroupId: options.GroupId,
  //     Publisher: options.Publisher,
  //   }).last();
  // TODO: refactor later
  const persons = await getFromCache(db, {
    GroupId: options.GroupId,
    Publisher: options.Publisher,
  });
  const person = persons[persons.length - 1];
  return person ? person.Status : '' as ContentStatus;
};

export const has = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => !!(await getFromCache(db, {
  GroupId: options.GroupId,
  Publisher: options.Publisher,
})).length;

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.persons.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
  // const person = await db.persons.get(whereOptions);
  // TODO: refactor later
  invalidCache();
  const person = (await getFromCache(db, whereOptions))[0];
  if (person) {
    updateLatestStatus(db, person);
  }
};

const updateLatestStatus = async (db: Database, person: IDbPersonItem) => {
  await db.persons.where({
    GroupId: person.GroupId,
    Publisher: person.Publisher,
    Status: ContentStatus.synced,
  }).and((p) => p.Id !== person.Id).modify({
    Status: ContentStatus.replaced,
  });
  // TODO: refactor later
  invalidCache();
};

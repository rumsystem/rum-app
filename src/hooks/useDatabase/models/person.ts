import Database, { IDbExtra } from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import _getProfile from 'store/selectors/getProfile';
import { createDatabaseCache } from 'hooks/useDatabase/cache';
import { IProfile } from 'store/group';
import { IPersonItem } from 'apis/group';

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IUser {
  profile: IProfile
  publisher: string
  objectCount: number
}

const personsCache = createDatabaseCache({
  tableName: 'persons',
  optimizedKeys: ['GroupId', 'Publisher'],
});

export const get = async (db: Database, whereOptions: {
  TrxId: string
}) => {
  const persons = await personsCache.get(db, whereOptions);
  return persons[0];
};

export const create = async (db: Database, person: IDbPersonItem) => {
  await personsCache.add(db, person);
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
  if (options.latest) {
    const persons = await personsCache.get(db, {
      GroupId: options.GroupId,
      Publisher: options.Publisher,
    });
    person = persons[persons.length - 1];
  } else {
    person = (await personsCache.get(db, {
      GroupId: options.GroupId,
      Publisher: options.Publisher,
      Status: ContentStatus.synced,
    }))[0];
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
  const persons = await personsCache.get(db, {
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
) => {
  const list = await personsCache.get(db, {
    GroupId: options.GroupId,
    Publisher: options.Publisher,
  });
  return !!list.length;
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.persons.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
  personsCache.invalidCache(db);
  const person = (await personsCache.get(db, whereOptions))[0];
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
  personsCache.invalidCache(db);
};

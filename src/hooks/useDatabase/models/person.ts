import Database, { IDbExtra } from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import _getProfile from 'store/selectors/getProfile';
import { IProfile } from 'store/group';
import { IPersonItem } from 'apis/group';

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
  await db.persons.add(person);
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
  },
) => {
  const person = await db.persons
    .get({
      GroupId: options.GroupId,
      Publisher: options.Publisher,
      Status: ContentStatus.synced,
    });
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

const updateLatestStatus = async (db: Database, person: IDbPersonItem) => {
  await db.persons.where({
    GroupId: person.GroupId,
    Publisher: person.Publisher,
    Status: ContentStatus.synced,
  }).and((p) => p.Id !== person.Id).modify({
    Status: ContentStatus.replaced,
  });
};

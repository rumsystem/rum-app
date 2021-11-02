import Database, { IDbExtra } from 'hooks/useDatabase/database';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import _getProfile from 'store/selectors/getProfile';
import { IProfile } from 'store/group';
import { IPersonItem } from 'apis/group';

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IUser {
  profile: IProfile
  publisher: string
  objectCount: number
}

export const create = async (db: Database, person: IDbPersonItem) => {
  await db.persons.add(person);
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
    .where({
      GroupId: options.GroupId,
      Publisher: options.Publisher,
    })
    .last();
  const profile = _getProfile(options.Publisher, person || null);
  const user = {
    profile,
    publisher: options.Publisher,
    objectCount: 0,
  } as IUser;
  if (options.withObjectCount) {
    user.objectCount = await SummaryModel.getCount(db, {
      ObjectId: options.Publisher,
      ObjectType: SummaryModel.SummaryObjectType.publisherObject,
    });
  }
  return user;
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

import { Database, SummaryObjectType, IDbPersonItem } from 'hooks/useDatabase';
import _getProfile from 'store/selectors/getProfile';
import { IProfile } from 'store/group';

export interface IUser {
  profile: IProfile;
  publisher: string;
  objectCount: number;
}

export const create = async (db: Database, person: IDbPersonItem) => {
  await db.persons.add(person);
};

export const getUser = async (
  db: Database,
  options: {
    GroupId: string;
    Publisher: string;
    withObjectCount?: boolean;
  }
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
    const objectCountSummary = await db.summary.get({
      ObjectId: options.Publisher,
      ObjectType: SummaryObjectType.publisherObject,
    });
    user.objectCount = objectCountSummary ? objectCountSummary.Count : 0;
  }
  return user;
};

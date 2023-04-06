import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export interface IDBProfileRaw {
  trxId: string
  publisher: string
  groupId: string
  name: string
  avatar?: {
    mediaType: string
    content: string
  }
  wallet?: Array<{
    id: string
    type: string
    name: string
  }>
  timestamp: number
  status: ContentStatus
}
export interface IDBProfile extends IDBProfileRaw {
  extra: {
    postCount: number
  }
}

interface GetProfileOptionByPublisher {
  groupId: string
  publisher: string
}
interface GetProfileOptionByTrxId {
  groupId: string
  trxId: string
}
interface GetProfile {
  (db: Database, options: GetProfileOptionByPublisher & { raw: true, useFallback: true }): Promise<IDBProfileRaw>
  (db: Database, options: GetProfileOptionByPublisher & { raw?: false, useFallback: true }): Promise<IDBProfile>
  (db: Database, options: GetProfileOptionByPublisher & { raw: true, useFallback?: false }): Promise<IDBProfileRaw | null>
  (db: Database, options: GetProfileOptionByPublisher & { raw?: false, useFallback?: false }): Promise<IDBProfile | null>
  (db: Database, options2: GetProfileOptionByTrxId & { raw: true }): Promise<IDBProfileRaw | null>
  (db: Database, options2: GetProfileOptionByTrxId & { raw?: false }): Promise<IDBProfile | null>
}
export const get: GetProfile = async (db, options): Promise<any> => {
  let profile: IDBProfileRaw | undefined;
  if ('publisher' in options) {
    profile = await db.profiles.get({
      groupId: options.groupId,
      publisher: options.publisher,
    });
    if (!profile) {
      if (!options.useFallback) {
        return null;
      }
      profile = await getFallbackProfile(db, {
        groupId: options.groupId,
        publisher: options.publisher,
        raw: options.raw as any,
      });
    }
  } else {
    profile = await db.profiles.get({
      trxId: options.trxId,
      groupId: options.groupId,
    });
  }
  if (options.raw) {
    return profile;
  }
  if (!profile) { return null; }
  return packProfile(db, profile);
};

interface BulkGet {
  (db: Database, data: Array<{ groupId: string, publisher: string }>, options: { raw: true }): Promise<Array<IDBProfileRaw>>
  (db: Database, data: Array<{ groupId: string, publisher: string }>, options?: { raw?: false }): Promise<Array<IDBProfile>>
}
export const bulkGet: BulkGet = async (db, data, options): Promise<any> => {
  const persons = await db.profiles
    .where('[groupId+publisher]')
    .anyOf(data.map((v) => [v.groupId, v.publisher]))
    .toArray();
  if (options?.raw) { return persons; }
  return Promise.all(persons.map((v) => packProfile(db, v)));
};

export const add = async (db: Database, profile: IDBProfileRaw) => {
  await db.profiles.add(profile);
};

export const bulkAdd = async (db: Database, profiles: Array<IDBProfileRaw>) => {
  await db.profiles.bulkAdd(profiles);
};

export const put = async (db: Database, profile: IDBProfileRaw) => {
  await db.profiles.put(profile);
};

export const bulkPut = async (db: Database, profiles: Array<IDBProfileRaw>) => {
  await db.profiles.bulkPut(profiles);
};


interface GetFallbackProfile {
  (db: Database, options: { groupId: string, publisher: string, raw: true }): Promise<IDBProfileRaw>
  (db: Database, options: { groupId: string, publisher: string, raw?: false }): Promise<IDBProfile>
}
export const getFallbackProfile: GetFallbackProfile = async (db, options): Promise<any> => {
  const profile: IDBProfileRaw = {
    trxId: '',
    groupId: options.groupId,
    publisher: options.publisher,
    name: options.publisher.slice(-10, -2),
    status: ContentStatus.synced,
    timestamp: Date.now() * 1000000,
  };
  if (options.raw) { return profile; }
  return packProfile(db, profile);
};

export const packProfile = async (db: Database, profile: IDBProfileRaw) => {
  const item = profile as IDBProfile;
  if (!item.name) {
    item.name = item.publisher.slice(-10, -2);
  }
  const postCount = await db.posts.where({
    groupId: profile.groupId,
    publisher: profile.publisher,
    deleted: 0,
  }).count();

  item.extra = {
    postCount,
  };
  return item;
};

// export interface IDbPersonItem extends IPersonItem, IDbExtra {}

// export interface IUser {
//   profile: IProfile
//   publisher: string
//   objectCount: number
// }

// export const get = async (db: Database, whereOptions: {
//   TrxId: string
// }) => {
//   const person = await db.persons.get(whereOptions);
//   return person;
// };

// export const create = async (db: Database, person: IDbPersonItem) => {
//   await bulkPut(db, [person]);
// };

// export const bulkPut = async (db: Database, persons: IDbPersonItem[]) => {
//   await db.persons.bulkPut(persons);
// };

// export const bulkGetByPublishers = async (db: Database, publishers: string[]) => {
//   const persons = await db.persons.where('Publisher').anyOf(publishers).toArray();
//   return persons;
// };

// export const bulkGetByTrxIds = async (db: Database, trxIds: string[]) => {
//   const persons = await db.persons.where('TrxId').anyOf(trxIds).toArray();
//   return persons;
// };

// export const getUser = async (
//   db: Database,
//   options: {
//     GroupId: string
//     Publisher: string
//     nodeId?: string
//     withObjectCount?: boolean
//     latest?: boolean
//   },
// ) => {
//   let person;
//   if (options.latest) {
//     person = await db.persons
//       .where({
//         GroupId: options.GroupId,
//         Publisher: options.Publisher,
//       }).last();
//   } else {
//     person = await db.persons
//       .where({
//         GroupId: options.GroupId,
//         Publisher: options.Publisher,
//         Status: ContentStatus.synced,
//       }).last();
//   }
//   const profile = _getProfile(options.Publisher, person || null);
//   const user = {
//     profile,
//     publisher: options.Publisher,
//     objectCount: 0,
//   } as IUser;
//   if (options.withObjectCount) {
//     user.objectCount = await SummaryModel.getCount(db, {
//       GroupId: options.GroupId,
//       ObjectId: options.Publisher,
//       ObjectType: SummaryModel.SummaryObjectType.publisherObject,
//     });
//   }
//   return user;
// };

// export const getLatestProfile = async (
//   db: Database,
//   options: {
//     GroupId: string
//     Publisher: string
//   },
// ) => {
//   const person = await db.persons.where({
//     GroupId: options.GroupId,
//     Publisher: options.Publisher,
//   }).last();
//   if (!person) {
//     return null;
//   }
//   const profile = _getProfile(options.Publisher, person);
//   const result = {
//     profile,
//     time: person.TimeStamp,
//     status: person.Status,
//     person,
//   };
//   return result;
// };

// export const getUsers = async (
//   db: Database,
//   queries: {
//     GroupId: string
//     Publisher: string
//   }[],
//   options?: {
//     withObjectCount?: boolean
//   },
// ) => {
//   const queryArray = queries.map((query) => [query.GroupId, query.Publisher, ContentStatus.synced]);
//   const persons = await db.persons
//     .where('[GroupId+Publisher+Status]').anyOf(queryArray).toArray();
//   const map = keyBy(persons, (person) => person.Publisher);
//   let objectCounts = [] as number[];
//   if (options?.withObjectCount) {
//     objectCounts = await SummaryModel.getCounts(db, queries.map((query) => ({
//       GroupId: query.GroupId,
//       ObjectId: query.Publisher,
//       ObjectType: SummaryModel.SummaryObjectType.publisherObject,
//     })));
//   }
//   return queries.map((query, index) => {
//     const profile = _getProfile(query.Publisher, map[query.Publisher] || null);
//     const user = {
//       profile,
//       publisher: query.Publisher,
//       objectCount: options?.withObjectCount ? objectCounts[index] : 0,
//     } as IUser;
//     return user;
//   });
// };

// export const getLatestPersonStatus = async (
//   db: Database,
//   options: {
//     GroupId: string
//     Publisher: string
//   },
// ) => {
//   const person = await db.persons
//     .where({
//       GroupId: options.GroupId,
//       Publisher: options.Publisher,
//     }).last();
//   return person ? person.Status : '' as ContentStatus;
// };

// export const has = async (
//   db: Database,
//   options: {
//     GroupId: string
//     Publisher: string
//   },
// ) => !!await db.persons
//   .get({
//     GroupId: options.GroupId,
//     Publisher: options.Publisher,
//   });

// export const markedAsSynced = async (
//   db: Database,
//   whereOptions: {
//     TrxId: string
//   },
// ) => {
//   await db.persons.where(whereOptions).modify({
//     Status: ContentStatus.synced,
//   });
// };

// export const getProfile = _getProfile;

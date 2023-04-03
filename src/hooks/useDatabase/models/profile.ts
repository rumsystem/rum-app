import type Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import Dexie from 'dexie';

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
    profile = await db.profiles
      .where('[groupId+publisher+timestamp]')
      .between(
        [options.groupId, options.publisher, Dexie.minKey],
        [options.groupId, options.publisher, Dexie.maxKey],
      ).reverse().first();
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
    profile = await db.profiles
      .where('[groupId+trxId+timestamp]')
      .between(
        [options.groupId, options.trxId, Dexie.minKey],
        [options.groupId, options.trxId, Dexie.maxKey],
      ).reverse().first();
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
  const persons = await Promise.all(
    data.map((v) => get(db, v), options),
  );
  return persons.filter(<T>(v: T | null): v is T => !!v);
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

import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { bulkGetLikeStatus } from 'hooks/useDatabase/models/likeStatus';
import Dexie from 'dexie';

export interface IDBPostRaw {
  id: string
  trxId: string
  groupId: string
  name: string
  content: string
  images?: Array<{
    mediaType: string
    content: string
  }>
  status: ContentStatus
  publisher: string
  timestamp: number
  deleted: 1 | 0
  history: Array<unknown>
  summary: {
    hotCount: number
    commentCount: number
    likeCount: number
    dislikeCount: number
  }
}

export interface IDBPost extends IDBPostRaw {
  extra: {
    user: ProfileModel.IDBProfile
    likeCount: number
    dislikeCount: number
    transferCount?: number
  }
}

export enum Order {
  desc,
  hot,
}

export const DEFAULT_SUMMARY = {
  hotCount: 0,
  commentCount: 0,
  likeCount: 0,
  dislikeCount: 0,
};

export const add = async (db: Database, object: Omit<IDBPostRaw, 'summary'>) => {
  await db.posts.add({
    ...object,
    summary: DEFAULT_SUMMARY,
  });
  // await syncSummary(db, object.groupId, object.publisher);
};


export const bulkAdd = async (db: Database, objects: Array<Omit<IDBPostRaw, 'summary'>>) => {
  if (!objects.length) { return; }
  await db.posts.bulkAdd(objects.map((v) => ({
    ...v,
    summary: DEFAULT_SUMMARY,
  })));
  // await syncSummary(db, object.groupId, object.publisher);
};

type GetPostOptionCommon = { groupId: string, currentPublisher?: string } & ({ id: string } | { trxId: string });
interface GetPost {
  (db: Database, options: GetPostOptionCommon & { raw: true }): Promise<IDBPostRaw | null>
  (db: Database, options: GetPostOptionCommon & { raw?: false }): Promise<IDBPost | null>
}

export const get: GetPost = async (db, options) => {
  const object = await db.posts.get({
    groupId: options.groupId,
    ...'id' in options
      ? { id: options.id }
      : { trxId: options.trxId },
    deleted: 0,
  });

  if (!object) {
    return null;
  }

  if (options.raw) {
    return object as any;
  }

  const [result] = await packPosts(db, [object], {
    currentPublisher: options.currentPublisher,
  });

  return result;
};


interface BulkGet {
  (db: Database, data: Array<{ id: string, groupId: string }>, options: { raw: true }): Promise<Array<IDBPostRaw>>
  (db: Database, data: Array<{ id: string, groupId: string }>, options?: { raw?: false }): Promise<Array<IDBPost>>
}

export const bulkGet: BulkGet = async (db, data, options): Promise<any> => {
  const posts = await db.posts
    .where('[groupId+id+deleted]')
    .anyOf(data.map((v) => [v.groupId, v.id, 0]))
    .toArray();
  return options?.raw ? posts : packPosts(db, posts);
};


export interface IListOptions {
  GroupId: string
  limit: number
  currentPublisher: string
  TimeStamp?: number
  Publisher?: string
  publisherSet?: Set<string>
  excludedPublisherSet?: Set<string>
  searchText?: string
  order?: Order
}

// how it's orderd:
// https://github.com/dexie/Dexie.js/issues/297#issuecomment-492023301
export const list = async (db: Database, options: IListOptions) => {
  let collection: Dexie.Collection<IDBPostRaw, number>;

  if (options.order === Order.hot) {
    collection = db.posts
      .where('[groupId+summary.hotCount]')
      .between(
        [options.GroupId, Dexie.minKey],
        [options.GroupId, Dexie.maxKey],
      )
      .reverse();
  } else {
    collection = db.posts
      .where('[groupId+timestamp]')
      .between(
        [options.GroupId, Dexie.minKey],
        [options.GroupId, Dexie.maxKey],
      )
      .reverse();
  }

  collection.and((v) => !v.deleted);

  if (
    options.TimeStamp
    || options.Publisher
    || options.searchText
    || options.publisherSet
    || options.excludedPublisherSet
  ) {
    collection = collection.and(
      (object) => {
        const conditions = [
          !options.TimeStamp || object.timestamp < options.TimeStamp,
          !options.Publisher || object.publisher === options.Publisher,
          !options.searchText
            || new RegExp(options.searchText, 'i').test(object.name ?? '')
            || new RegExp(options.searchText, 'i').test(object.content ?? ''),
          !options.publisherSet || options.publisherSet.has(object.publisher),
          !options.excludedPublisherSet || !options.excludedPublisherSet.has(object.publisher),
        ];
        return conditions.every(Boolean);
      },
    );
  }

  const result = await db.transaction(
    'r',
    [db.profiles, db.summary, db.posts, db.counters],
    async () => {
      collection = collection
        .offset(0)
        .limit(options.limit);
      const objects = await collection.toArray();

      if (objects.length === 0) {
        return [];
      }

      const result = await packPosts(db, objects, {
        currentPublisher: options.currentPublisher,
      });
      return result;
    },
  );

  return result;
};

export const getPostCount = async (db: Database, options: { groupId: string, publisher: string }) => {
  const count = await db.posts.where({ ...options, deleted: 0 }).count();
  return count;
};

export const markedAsSynced = async (db: Database, data: { groupId: string, id: string }) => {
  await db.posts.where(data).modify({
    Status: ContentStatus.synced,
  });
};

const packPosts = async (
  db: Database,
  objects: IDBPostRaw[],
  options?: { currentPublisher?: string },
) => {
  const posts = objects as IDBPost[];
  const [users, counterStatusList, transferCounts] = await Promise.all([
    ProfileModel.bulkGet(
      db,
      posts.map((post) => ({
        groupId: post.groupId,
        publisher: post.publisher,
      })),
    ),
    options && options.currentPublisher
      ? bulkGetLikeStatus(db, posts.map((v) => ({
        groupId: v.groupId,
        publisher: options.currentPublisher!,
        objectId: v.id,
      })))
      : Promise.resolve([]),
    SummaryModel.getCounts(db, posts.map((post) => ({
      GroupId: '',
      ObjectId: post.id,
      ObjectType: SummaryModel.SummaryObjectType.transferCount,
    }))),
  ]);

  await Promise.all(posts.map(async (post, index) => {
    const user = users.find((v) => v.groupId === post.groupId && v.publisher === post.publisher)
      ?? await ProfileModel.getFallbackProfile(db, {
        groupId: post.groupId,
        publisher: post.publisher,
      });
    post.extra = {
      user,
      transferCount: transferCounts[index] || 0,
      likeCount: options?.currentPublisher ? counterStatusList[index].likeCount : 0,
      dislikeCount: options?.currentPublisher ? counterStatusList[index].dislikeCount : 0,
    };
  }));

  return posts;
};

export const put = async (db: Database, post: IDBPost | IDBPostRaw) => {
  await bulkPut(db, [post]);
};

export const bulkPut = async (
  db: Database,
  posts: Array<IDBPost | IDBPostRaw>,
) => {
  const normalizedPosts = posts.map((v) => {
    if ('extra' in v) {
      const { extra, ...u } = v;
      return u;
    }
    return v;
  });
  await db.posts.bulkPut(normalizedPosts);
};

export const getFirstPost = async (db: Database, groupId: string) => {
  const object = await db.posts.get({ groupId });

  if (!object) {
    return null;
  }

  return object;
};

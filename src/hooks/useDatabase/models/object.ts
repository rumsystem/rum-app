import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { bulkGetLikeStatus } from 'hooks/useDatabase/models/likeStatus';
import { INoteItem } from 'apis/content';
import { keyBy } from 'lodash';
import Dexie from 'dexie';

export interface IDbObjectItemPayload extends INoteItem, IDbExtra {}

export interface IDbObjectItem extends IDbObjectItemPayload {
  Summary: {
    hotCount: number
    commentCount: number
    likeCount: number
    dislikeCount: number
  }
}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Extra: {
    user: PersonModel.IUser
    likedCount?: number
    dislikedCount?: number
  }
}

export const DEFAULT_SUMMARY = {
  hotCount: 0,
  commentCount: 0,
  likeCount: 0,
  dislikeCount: 0,
};

export const create = async (db: Database, object: IDbObjectItemPayload) => {
  await db.objects.add({
    ...object,
    Summary: DEFAULT_SUMMARY,
  });
  await syncSummary(db, object.GroupId, object.Publisher);
};

export const bulkCreate = async (db: Database, objects: Array<IDbObjectItemPayload>) => {
  const _objects = objects.map((object) => ({
    ...object,
    Summary: DEFAULT_SUMMARY,
  }));
  await db.objects.bulkAdd(_objects);
  const set = new Set<string>();
  const objectsNeedToSync = objects.filter((v) => {
    const id = `${v.GroupId}-${v.Publisher}`;
    if (!set.has(id)) {
      set.add(id);
      return true;
    }
    return false;
  });
  await Promise.all(
    objectsNeedToSync.map(
      (v) => syncSummary(db, v.GroupId, v.Publisher),
    ),
  );
};

const syncSummary = async (db: Database, GroupId: string, Publisher: string) => {
  const count = await db.objects
    .where({
      GroupId,
      Publisher,
    })
    .count();
  await SummaryModel.createOrUpdate(db, {
    GroupId,
    ObjectId: Publisher,
    ObjectType: SummaryModel.SummaryObjectType.publisherObject,
    Count: count,
  });
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

export enum Order {
  desc,
  hot,
}

export const list = async (db: Database, options: IListOptions) => {
  let collection: Dexie.Collection;

  if (options.order === Order.hot) {
    collection = db.objects.where('[GroupId+Summary.hotCount]').between([options.GroupId, Dexie.minKey], [options.GroupId, Dexie.maxKey]);
  } else {
    collection = db.objects.where('[GroupId+TimeStamp]').between([options.GroupId, Dexie.minKey], [options.GroupId, Dexie.maxKey]);
  }

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
          !options.TimeStamp || object.TimeStamp < options.TimeStamp,
          !options.Publisher || object.Publisher === options.Publisher,
          !options.searchText
            || new RegExp(options.searchText, 'i').test(object.Content.name ?? '')
            || new RegExp(options.searchText, 'i').test(object.Content.content ?? ''),
          !options.publisherSet || options.publisherSet.has(object.Publisher),
          !options.excludedPublisherSet || !options.excludedPublisherSet.has(object.Publisher),
        ];
        return conditions.every(Boolean);
      },
    );
  }

  const result = await db.transaction(
    'r',
    [db.persons, db.summary, db.objects, db.likes],
    async () => {
      const objects = await collection
        .reverse()
        .offset(0)
        .limit(options.limit)
        .toArray();

      if (objects.length === 0) {
        return [];
      }

      const result = await packObjects(db, objects, {
        currentPublisher: options.currentPublisher,
      });
      return result;
    },
  );

  return result;
};

export const get = async (
  db: Database,
  options: {
    TrxId: string
    raw?: boolean
    currentPublisher?: string
  },
) => {
  const object = await db.objects.get({
    TrxId: options.TrxId,
  });

  if (!object) {
    return null;
  }

  if (options.raw) {
    return object as IDbDerivedObjectItem;
  }

  const [result] = await packObjects(db, [object], {
    currentPublisher: options.currentPublisher,
  });

  return result;
};

export const getFirstBlock = async (
  db: Database,
  groupId: string,
) => {
  const object = await db.objects.get({
    GroupId: groupId,
  });

  if (!object) {
    return null;
  }

  return object;
};

export const bulkGet = async (
  db: Database,
  TrxIds: string[],
  options?: {
    raw: boolean
  },
) => {
  const { raw } = options || {};
  const objects = await db.objects.where('TrxId').anyOf(TrxIds).toArray();
  const derivedObjects = raw ? objects : await packObjects(db, objects);
  const map = keyBy(derivedObjects, (object) => object.TrxId);
  return TrxIds.map((TrxId) => map[TrxId] || null);
};

export const put = async (
  db: Database,
  trxId: string,
  object: IDbObjectItem,
) => {
  await db.objects.where({
    TrxId: trxId,
  }).modify(object);
};

export const bulkPut = async (
  db: Database,
  objects: IDbObjectItem[],
) => {
  await db.objects.bulkPut(objects);
};

const packObjects = async (
  db: Database,
  objects: IDbObjectItem[],
  options?: {
    currentPublisher?: string
  },
) => {
  const objectTrxIds = objects.map((object) => object.TrxId);
  const [users, likeStatusList] = await Promise.all([
    PersonModel.getUsers(db, objects.map((object) => ({
      GroupId: object.GroupId,
      Publisher: object.Publisher,
    })), {
      withObjectCount: true,
    }),
    options && options.currentPublisher ? bulkGetLikeStatus(db, {
      Publisher: options.currentPublisher,
      objectTrxIds,
    }) : Promise.resolve([]),
  ]);
  return objects.map((object, index) => {
    const item = {
      ...object,
      Extra: {
        user: users[index],
      },
    } as IDbDerivedObjectItem;
    if (options && options.currentPublisher) {
      item.Extra.likedCount = likeStatusList[index].likedCount;
      item.Extra.dislikedCount = likeStatusList[index].dislikedCount;
    }
    return item;
  });
};

export const markedAsSynced = async (
  db: Database,
  TrxId: string,
) => {
  await db.objects.where({ TrxId }).modify({
    Status: ContentStatus.synced,
  });
};

export const checkExistForPublisher = async (
  db: Database,
  options: {
    GroupId: string
    Publisher: string
  },
) => {
  const object = await db.objects.get(options);

  return !!object;
};

export const remove = async (
  db: Database,
  trxId: string,
) => {
  await db.objects.where({
    TrxId: trxId,
  }).delete();
};

export const bulkRemove = async (
  db: Database,
  trxIds: string[],
) => {
  await db.objects.where('TrxId').anyOf(trxIds).delete();
};

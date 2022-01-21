import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { IObjectItem } from 'apis/content';
import { keyBy } from 'lodash';

export interface IDbObjectItem extends IObjectItem, IDbExtra {
  commentCount?: number
}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Extra: {
    user: PersonModel.IUser
    upVoteCount: number
    voted: boolean
  }
}

export const create = async (db: Database, object: IDbObjectItem) => {
  await db.objects.add(object);
  await syncSummary(db, object.GroupId, object.Publisher);
};

export const bulkCreate = async (db: Database, objects: Array<IDbObjectItem>) => {
  await db.objects.bulkAdd(objects);
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
  TimeStamp?: number
  Publisher?: string
  excludedPublisherSet?: Set<string>
  searchText?: string
}

export const list = async (db: Database, options: IListOptions) => {
  let collection = db.objects.where({
    GroupId: options.GroupId,
  });

  if (
    options.TimeStamp
    || options.Publisher
    || options.searchText
    || options.excludedPublisherSet
  ) {
    collection = collection.and(
      (object) => {
        const conditions = [
          !options.TimeStamp || object.TimeStamp < options.TimeStamp,
          !options.Publisher || object.Publisher === options.Publisher,
          !options.searchText
            || new RegExp(options.searchText, 'i').test(object.Content.name ?? '')
            || new RegExp(options.searchText, 'i').test(object.Content.content),
          !options.excludedPublisherSet || !options.excludedPublisherSet.has(object.Publisher),
        ];
        return conditions.every(Boolean);
      },
    );
  }

  const result = await db.transaction(
    'r',
    [db.persons, db.summary, db.objects],
    async () => {
      const objects = await collection
        .reverse()
        .offset(0)
        .limit(options.limit)
        .sortBy('TimeStamp');

      if (objects.length === 0) {
        return [];
      }

      const result = await packObjects(db, objects);
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

  const [result] = await packObjects(db, [object]);

  return result;
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

export const bulkPut = async (
  db: Database,
  objects: IDbObjectItem[],
) => {
  await db.objects.bulkPut(objects);
};

const packObjects = async (
  db: Database,
  objects: IDbObjectItem[],
) => {
  const [users, upVoteSummaries] = await Promise.all([
    PersonModel.getUsers(db, objects.map((object) => ({
      GroupId: object.GroupId,
      Publisher: object.Publisher,
    })), {
      withObjectCount: true,
    }),
    SummaryModel.getCounts(db, objects.map((object) => ({
      GroupId: object.GroupId,
      ObjectId: object.TrxId,
      ObjectType: SummaryModel.SummaryObjectType.objectUpVote,
    }))),
  ]);
  return objects.map((object, index) => ({
    ...object,
    Extra: {
      user: users[index],
      upVoteCount: upVoteSummaries[index],
      voted: false,
    },
  } as IDbDerivedObjectItem));
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.objects.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
};

export const bulkMarkedAsSynced = async (
  db: Database,
  ids: Array<number>,
) => {
  await db.objects.where(':id').anyOf(ids).modify({
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

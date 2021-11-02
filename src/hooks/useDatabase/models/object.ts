import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as VoteModel from 'hooks/useDatabase/models/vote';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import { IObjectItem, IVoteObjectType } from 'apis/group';
import { IUser } from './person';
import { createDatabaseCache } from '../cache';

const objectCache = createDatabaseCache({
  tableName: 'objects',
  optimizedKeys: ['GroupId', 'Publisher'],
});

export interface IDbObjectItem extends IObjectItem, IDbExtra {}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Extra: {
    user: IUser
    commentCount: number
    upVoteCount: number
    voted: boolean
  }
}

export const create = async (db: Database, object: IDbObjectItem) => {
  await objectCache.add(db, object);
  await syncSummary(db, object);
};

const syncSummary = async (db: Database, object: IDbObjectItem) => {
  const count = (await objectCache.get(db, {
    GroupId: object.GroupId,
    Publisher: object.Publisher,
  })).length;
  await SummaryModel.createOrUpdate(db, {
    GroupId: object.GroupId,
    ObjectId: object.Publisher,
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
  currentPublisher?: string
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
      (object) =>
        (!options.TimeStamp || object.TimeStamp < options.TimeStamp)
        && (!options.Publisher || object.Publisher === options.Publisher)
        && (!options.searchText
          || new RegExp(options.searchText, 'i').test(object.Content.content))
        && (!options.excludedPublisherSet
          || !options.excludedPublisherSet.has(object.Publisher)),
    );
  }

  const objects = await collection
    .reverse()
    .offset(0)
    .limit(options.limit)
    .sortBy('TimeStamp');

  if (objects.length === 0) {
    return [];
  }

  const result = await Promise.all(
    objects.map((object) => packObject(db, object, {
      currentPublisher: options.currentPublisher,
    })),
  );

  return result;
};

export const get = async (
  db: Database,
  options: {
    TrxId: string
    currentPublisher?: string
  },
) => {
  const object = (await objectCache.get(db, {
    TrxId: options.TrxId,
  }))[0];

  if (!object) {
    return null;
  }

  const result = await packObject(db, object, {
    currentPublisher: options.currentPublisher,
  });

  return result;
};

const packObject = async (
  db: Database,
  object: IDbObjectItem,
  options: {
    currentPublisher?: string
  } = {},
) => {
  const [user, commentCount, upVoteCount, existVote] = await Promise.all([
    PersonModel.getUser(db, {
      GroupId: object.GroupId,
      Publisher: object.Publisher,
      withObjectCount: true,
    }),
    SummaryModel.getCount(db, {
      ObjectId: object.TrxId,
      ObjectType: SummaryModel.SummaryObjectType.objectComment,
    }),
    SummaryModel.getCount(db, {
      ObjectId: object.TrxId,
      ObjectType: SummaryModel.SummaryObjectType.objectUpVote,
    }),
    options.currentPublisher
      ? VoteModel.get(db, {
        Publisher: options.currentPublisher,
        objectTrxId: object.TrxId,
        objectType: IVoteObjectType.object,
      })
      : Promise.resolve(null),
  ]);
  return {
    ...object,
    Extra: {
      user,
      upVoteCount,
      commentCount,
      voted: !!existVote,
    },
  } as IDbDerivedObjectItem;
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
  objectCache.invalidCache(db);
};

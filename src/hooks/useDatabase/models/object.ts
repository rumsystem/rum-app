import {
  Database,
  IDbObjectItem,
  SummaryObjectType,
  ContentStatus,
} from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as VoteModel from 'hooks/useDatabase/models/vote';
import { IVoteObjectType } from 'apis/group';
import { immediatePromise } from 'utils';

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Extra: {
    user: PersonModel.IUser;
    commentCount: number;
    upVoteCount: number;
    voted: boolean;
  };
}

export const create = async (db: Database, object: IDbObjectItem) => {
  await db.objects.add(object);
  await syncSummary(db, object);
};

const syncSummary = async (db: Database, object: IDbObjectItem) => {
  const objectSummaryQuery = {
    ObjectId: object.Publisher,
    ObjectType: SummaryObjectType.publisherObject,
  };
  const count = await db.objects
    .where({
      GroupId: object.GroupId,
      Publisher: object.Publisher,
    })
    .count();
  const existSummary = await db.summary.get(objectSummaryQuery);
  if (existSummary) {
    await db.summary.where(objectSummaryQuery).modify({
      Count: count,
    });
  } else {
    await db.summary.add({
      ...objectSummaryQuery,
      GroupId: object.GroupId,
      Count: count,
    });
  }
};

export interface IListOptions {
  GroupId: string;
  limit: number;
  TimeStamp?: number;
  Publisher?: string;
  excludedPublisherSet?: Set<string>;
  searchText?: string;
  currentPublisher?: string;
}

export const list = async (db: Database, options: IListOptions) => {
  let collection = db.objects.where({
    GroupId: options.GroupId,
  });

  if (
    options.TimeStamp ||
    options.Publisher ||
    options.searchText ||
    options.excludedPublisherSet
  ) {
    collection = collection.and(
      (object) =>
        (!options.TimeStamp || object.TimeStamp < options.TimeStamp) &&
        (!options.Publisher || object.Publisher === options.Publisher) &&
        (!options.searchText ||
          new RegExp(options.searchText, 'i').test(object.Content.content)) &&
        (!options.excludedPublisherSet ||
          !options.excludedPublisherSet.has(object.Publisher))
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
    objects.map((object) => {
      return packObject(db, object, {
        currentPublisher: options.currentPublisher,
      });
    })
  );

  return result;
};

export const get = async (
  db: Database,
  options: {
    TrxId: string;
    currentPublisher?: string;
  }
) => {
  const object = await db.objects.get({
    TrxId: options.TrxId,
  });

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
    currentPublisher?: string;
  } = {}
) => {
  const [user, commentSummary, upVoteCount, existVote] = await Promise.all([
    PersonModel.getUser(db, {
      GroupId: object.GroupId,
      Publisher: object.Publisher,
      withObjectCount: true,
    }),
    db.summary.get({
      ObjectId: object.TrxId,
      ObjectType: SummaryObjectType.objectComment,
    }),
    VoteModel.getSummaryVoteCount(db, {
      ObjectId: object.TrxId,
      ObjectType: SummaryObjectType.objectUpVote,
    }),
    options.currentPublisher
      ? VoteModel.get(db, {
          Publisher: options.currentPublisher,
          objectTrxId: object.TrxId,
          objectType: IVoteObjectType.object,
        })
      : immediatePromise(null),
  ]);
  return {
    ...object,
    Extra: {
      user,
      upVoteCount,
      commentCount: commentSummary ? commentSummary.Count : 0,
      voted: !!existVote,
    },
  } as IDbDerivedObjectItem;
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string;
  }
) => {
  await db.objects.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
};

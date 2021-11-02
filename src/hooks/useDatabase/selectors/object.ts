import { ContentTypeUrl } from 'apis/group';
import {
  Database,
  IDbObjectItem,
  IDbDerivedObjectItem,
  ContentStatus,
} from 'hooks/useDatabase';

export const queryObjects = async (
  database: Database,
  options: {
    GroupId: string;
    limit: number;
    offset?: number;
    Timestamp?: number;
    publisherSet?: Set<string>;
  }
) => {
  const db = database;
  let collection = db.objects.where({
    GroupId: options.GroupId,
  });

  if (options.Timestamp) {
    collection = collection.and(
      (object) => object.TimeStamp < options.Timestamp
    );
  }

  if (options.publisherSet) {
    collection = collection.and((object) =>
      options.publisherSet.has(object.Publisher)
    );
  }

  const objects = await collection
    .reverse()
    .offset(options.offset || 0)
    .limit(options.limit)
    .sortBy('TimeStamp');

  if (objects.length === 0) {
    return [];
  }

  const result = await Promise.all(
    objects.map((object) => {
      return packObject(object, db);
    })
  );

  return result;
};

export const queryObject = async (
  database: Database,
  options: {
    nodeId: string;
    TrxId: string;
    Status?: ContentStatus;
  }
) => {
  const db = database;
  const object = await db.objects.get(options);

  if (!object) {
    return null;
  }

  const result = await packObject(object, db);

  return result;
};

const packObject = async (object: IDbObjectItem, db: Database) => {
  const [person, summary] = await Promise.all([
    db.persons
      .where({
        GroupId: object.GroupId,
        Publisher: object.Publisher,
      })
      .last(),
    db.summary.get({
      GroupId: object.GroupId,
      Publisher: object.Publisher,
      TypeUrl: ContentTypeUrl.Object,
    }),
  ]);
  return {
    ...object,
    Person: person || null,
    Summary: summary,
  } as IDbDerivedObjectItem;
};

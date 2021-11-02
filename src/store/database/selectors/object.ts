import Database, {
  IDbObjectItem,
  IDbDerivedObjectItem,
  ContentStatus,
} from 'store/database';

export const queryObjects = async (options: {
  GroupId: string;
  limit: number;
  offset?: number;
  Timestamp?: number;
  publisherSet?: Set<string>;
}) => {
  let collection = new Database().objects.where({
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
    .toArray();

  if (objects.length === 0) {
    return [];
  }

  const result = await Promise.all(objects.map(packObject));

  return result;
};

// export const queryObjectsByTimestamp = async (options: {
//   GroupId: string;
//   limit: number;
//   Timestamp: number;
// }) => {
//   const objects = await new Database().objects
//     .where({
//       GroupId: options.GroupId,
//     })
//     .and((object) => object.TimeStamp < options.Timestamp)
//     .reverse()
//     .limit(options.limit)
//     .toArray();

//   if (objects.length === 0) {
//     return [];
//   }

//   const result = await Promise.all(objects.map(packObject));

//   return result;
// };

// export const queryObjectsByPublishers = async (options: {
//   GroupId: string;
//   limit: number;
//   offset?: number;
//   publishers: string[];
// }) => {
//   const objects = await new Database().objects
//     .where('Publisher')
//     .anyOf(options.publishers)
//     .and((object) => object.GroupId === options.GroupId)
//     .reverse()
//     .offset(options.offset || 0)
//     .limit(options.limit)
//     .toArray();

//   if (objects.length === 0) {
//     return [];
//   }

//   const result = await Promise.all(objects.map(packObject));

//   return result;
// };

export const queryObject = async (options: {
  TrxId: string;
  Status?: ContentStatus;
}) => {
  const object = await new Database().objects.get(options);

  if (!object) {
    return null;
  }

  const result = await packObject(object);

  return result;
};

const packObject = async (object: IDbObjectItem) => {
  const person = await new Database().persons
    .where({
      GroupId: object.GroupId,
      Publisher: object.Publisher,
    })
    .last();
  return { ...object, Person: person || null } as IDbDerivedObjectItem;
};

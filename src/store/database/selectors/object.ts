import Database, {
  IDbObjectItem,
  IDbDerivedObjectItem,
  ContentStatus,
} from 'store/database';

export const queryObjects = async (options: {
  GroupId: string;
  limit: number;
  offset?: number;
}) => {
  const objects = await new Database().objects
    .where({
      GroupId: options.GroupId,
    })
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

export const queryObjectsFrom = async (options: {
  GroupId: string;
  limit: number;
  Timestamp: number;
}) => {
  const objects = await new Database().objects
    .where({
      GroupId: options.GroupId,
    })
    .and((object) => object.TimeStamp < options.Timestamp)
    .reverse()
    .limit(options.limit)
    .toArray();

  if (objects.length === 0) {
    return [];
  }

  const result = await Promise.all(objects.map(packObject));

  return result;
};

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

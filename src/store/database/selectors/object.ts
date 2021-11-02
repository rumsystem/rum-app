import Database, {
  IDbObjectItem,
  IDbDerivedObjectItem,
  ContentStatus,
} from 'store/database';

export const queryObjects = async (options: {
  GroupId: string;
  limit: number;
}) => {
  const objects = await new Database().objects
    .where({
      GroupId: options.GroupId,
    })
    .limit(options.limit)
    .reverse()
    .sortBy('TimeStamp');

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
      Publisher: object.Publisher,
    })
    .limit(1)
    .reverse()
    .sortBy('TimeStamp');
  return { ...object, Person: person[0] || null } as IDbDerivedObjectItem;
};

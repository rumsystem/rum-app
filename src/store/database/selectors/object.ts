import Database, { IDbObjectItem, IDbDerivedObjectItem } from 'store/database';

export const queryObjects = async (options: {
  groupId: string;
  limit: number;
}) => {
  const { groupId, limit = 10 } = options;
  const db = new Database();

  const objects = await db.objects
    .where({
      GroupId: groupId,
    })
    .limit(limit)
    .toArray();

  if (objects.length === 0) {
    return [];
  }

  const result = await Promise.all(objects.map(packObject));

  return result;
};

export const queryObject = async (options: {
  groupId: string;
  trxId: string;
}) => {
  const { groupId, trxId } = options;
  const db = new Database();

  const object = await db.objects.get({
    GroupId: groupId,
    TrxId: trxId,
  });

  if (!object) {
    return null;
  }

  const result = await packObject(object);

  return result;
};

const packObject = async (object: IDbObjectItem) => {
  const db = new Database();
  const person = await db.persons.get({
    Publisher: object.Publisher,
  });
  return { ...object, Person: person } as IDbDerivedObjectItem;
};

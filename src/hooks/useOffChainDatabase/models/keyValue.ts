import type OffChainDatabase from 'hooks/useOffChainDatabase/database';

export const createOrUpdate = async (
  db: OffChainDatabase,
  data: {
    key: string
    value: any
  },
) => {
  const exist = await get(db, {
    key: data.key,
  });
  if (exist) {
    await db.keyValues.where({
      key: data.key,
    }).modify({
      value: data.value,
    });
  } else {
    await db.keyValues.add(data);
  }
};

export const remove = async (
  db: OffChainDatabase,
  whereOptions: {
    key: string
  },
) => {
  await db.keyValues.where(whereOptions).delete();
};

export const get = async (
  db: OffChainDatabase,
  whereOptions: {
    key: string
  },
) => db.keyValues.get(whereOptions);

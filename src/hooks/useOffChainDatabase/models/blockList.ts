import OffChainDatabase, { IDbBlockItem } from 'hooks/useOffChainDatabase/database';

export const create = async (
  db: OffChainDatabase,
  unFollowing: IDbBlockItem,
) => {
  await db.blockList.add({
    ...unFollowing,
  });
};

export const remove = async (
  db: OffChainDatabase,
  whereOptions: {
    GroupId: string
    Publisher: string
  },
) => {
  await db.blockList.where(whereOptions).delete();
};

export const list = async (
  db: OffChainDatabase,
  whereOptions: {
    GroupId: string
  },
) => db.blockList.where(whereOptions).toArray();

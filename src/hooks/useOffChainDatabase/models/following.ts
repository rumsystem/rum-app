import OffChainDatabase, { IDbFollowingItem } from 'hooks/useOffChainDatabase/database';

export const create = async (
  db: OffChainDatabase,
  following: IDbFollowingItem,
) => {
  await db.followings.add({
    ...following,
  });
};

export const remove = async (
  db: OffChainDatabase,
  whereOptions: {
    GroupId: string
    Publisher: string
  },
) => {
  await db.followings.where(whereOptions).delete();
};

export const list = async (
  db: OffChainDatabase,
  whereOptions: {
    GroupId: string
  },
) => db.followings.where(whereOptions).toArray();

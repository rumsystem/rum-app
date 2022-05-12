import OffChainDatabase, { IDbUnFollowingItem } from 'hooks/useOffChainDatabase/database';

export const create = async (
  db: OffChainDatabase,
  unFollowing: IDbUnFollowingItem,
) => {
  await db.unFollowings.add({
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
  await db.unFollowings.where(whereOptions).delete();
};

export const list = async (
  db: OffChainDatabase,
  whereOptions: {
    GroupId: string
  },
) => db.unFollowings.where(whereOptions).toArray();

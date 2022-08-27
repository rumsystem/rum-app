import type OffChainDatabase from 'hooks/useOffChainDatabase/database';
import { IProfile } from 'store/group';
import * as KeyValueModel from './keyValue';

const KEY = 'globalProfile';

export const createOrUpdate = async (
  db: OffChainDatabase,
  profile: IProfile,
) => {
  await KeyValueModel.createOrUpdate(db, {
    key: KEY,
    value: profile,
  });
};

export const remove = async (
  db: OffChainDatabase,
) => {
  await KeyValueModel.remove(db, {
    key: KEY,
  });
};

export const get = async (
  db: OffChainDatabase,
) => {
  const globalProfile: any = await KeyValueModel.get(db, {
    key: KEY,
  });
  return globalProfile ? globalProfile.value as IProfile : null;
};

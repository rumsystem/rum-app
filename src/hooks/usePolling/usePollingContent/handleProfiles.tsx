import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { Store } from 'store';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import { runInAction } from 'mobx';
import { ProfileType } from 'utils/contentDetector';
import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, store, objects, database } = options;
  const { activeGroupStore, groupStore } = store;

  if (objects.length === 0) { return; }

  await database.transaction(
    'rw',
    [
      database.profiles,
      database.posts,
    ],
    async () => {
      const items = objects.map((v) => ({
        content: v,
        activity: v.Content as any as ProfileType,
      }));
      const existedProfiles = await ProfileModel.bulkGet(
        database,
        items.map((v) => ({ groupId, publisher: v.content.Publisher })),
        { raw: true },
      );
      const profilesToPut: Array<ProfileModel.IDBProfileRaw> = [];

      for (const item of items) {
        const existedProfile = existedProfiles.find((v) => v.publisher === item.content.Publisher);
        if (existedProfile) {
          existedProfile.status = ContentStatus.synced;
          profilesToPut.push(existedProfile);
          continue;
        }

        const object = item.activity.object;

        profilesToPut.push({
          trxId: item.content.TrxId,
          timestamp: item.content.TimeStamp,
          status: ContentStatus.synced,
          groupId,
          publisher: item.content.Publisher,
          name: object.name,
          ...'avatar' in object ? { avatar: object.avatar } : {},
          ...'wallet' in object ? { wallet: object.wallet } : {},
        });
      }

      await ProfileModel.bulkPut(database, profilesToPut);
      const profiles = await ProfileModel.bulkGet(
        database,
        profilesToPut.map((v) => ({ groupId, publisher: v.publisher })),
      );

      runInAction(() => {
        profiles.forEach((profile) => {
          if (groupId === store.activeGroupStore.id) {
            activeGroupStore.updateProfileMap(profile.publisher, profile);
            const activeGroup = groupStore.map[activeGroupStore.id];
            const myPublicKey = (activeGroup || {}).user_pubkey;
            if (profile.publisher === myPublicKey) {
              activeGroupStore.setProfile(profile);
              groupStore.updateProfile(database, groupId);
            }
          } else {
            activeGroupStore.tryUpdateCachedProfileMap(groupId, profile.publisher, profile);
            const myPublicKey = (groupStore.map[groupId] || {}).user_pubkey;
            if (profile.publisher === myPublicKey) {
              groupStore.updateProfile(database, groupId);
            }
          }
        });
      });
    },
  );
};

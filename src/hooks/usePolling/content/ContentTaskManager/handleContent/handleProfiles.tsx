import { parseISO } from 'date-fns';
import { runInAction } from 'mobx';
import rumsdk from 'rum-sdk-browser';
import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import { ProfileType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, store, objects, database } = options;
  const { activeGroupStore, groupStore } = store;
  const activeGroup = groupStore.map[activeGroupStore.id];
  const myPublicKey = (activeGroup || {}).user_pubkey;

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
        activity: v.Data as any as ProfileType,
      }));
      const existedProfiles = await ProfileModel.bulkGet(
        database,
        items.map((v) => ({ groupId, trxId: v.content.TrxId })),
        { raw: true },
      );
      const profilesToPut: Array<ProfileModel.IDBProfileRaw> = [];

      for (const item of items) {
        const timestamp = item.activity.published
          ? parseISO(item.activity.published).getTime()
          : Number(item.content.TimeStamp.slice(0, -6));
        const existedProfile = existedProfiles.find((v) => v.trxId === item.content.TrxId);
        if (existedProfile) {
          const updateExistedProfile = existedProfile.status === ContentStatus.syncing
            && existedProfile.publisher === item.content.SenderPubkey;
          if (updateExistedProfile) {
            existedProfile.status = ContentStatus.synced;
            profilesToPut.push(existedProfile);
            if (existedProfile.publisher === myPublicKey) {
              const newProfile = await ProfileModel.get(database, {
                publisher: existedProfile.publisher,
                groupId: existedProfile.groupId,
              });
              runInAction(() => {
                if (newProfile) {
                  groupStore.setProfile(newProfile);
                  activeGroupStore.setProfile(newProfile);
                  activeGroupStore.updateProfileMap(newProfile.publisher, newProfile);
                }
              });
            }
          }
          continue;
        }

        const userAddr = rumsdk.utils.pubkeyToAddress(item.content.SenderPubkey);
        const object = item.activity.object;

        if (userAddr !== object.describes.id) {
          // not posting profile for publisher
          return;
        }

        const image = !('image' in object)
          ? null
          : Array.isArray(object.image)
            ? object.image[0]
            : object.image;

        profilesToPut.push({
          trxId: item.content.TrxId,
          timestamp,
          status: ContentStatus.synced,
          groupId,
          publisher: item.content.SenderPubkey,
          userAddress: rumsdk.utils.pubkeyToAddress(item.content.SenderPubkey),
          name: object.name,
          ...image ? { avatar: image } : {},
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

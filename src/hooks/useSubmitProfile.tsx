import React from 'react';
import ContentApi from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import { useStore } from 'store';
import useCanIPost from 'hooks/useCanIPost';
import { ProfileType } from 'utils/contentDetector';

type ProfileData = Pick<ProfileModel.IDBProfileRaw, 'name' | 'avatar' | 'wallet' | 'groupId' | 'publisher'>;

export default () => {
  const { groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitProfile = React.useCallback(
    async (profile: ProfileData, options?: {
      ignoreGroupStatus: boolean
    }) => {
      await canIPost(profile.groupId, {
        ignoreGroupStatus: (options && options.ignoreGroupStatus) || false,
      });

      const payload: ProfileType = {
        type: 'Create',
        object: {
          type: 'Person',
          name: profile.name,
          ...profile.avatar ? { avatar: { type: 'Image', ...profile.avatar } } : {},
          ...profile.wallet ? { wallet: profile.wallet } : {},
        },
      };

      let res;
      try {
        res = await ContentApi.postNote({
          group_id: profile.groupId,
          data: payload,
        }, profile.groupId);
      } catch (e) {
        return;
      }
      await ProfileModel.add(database, {
        trxId: res.trx_id,
        groupId: profile.groupId,
        publisher: profile.publisher,
        name: profile.name,
        avatar: profile.avatar,
        wallet: profile.wallet,
        timestamp: Date.now() * 1000000,
        status: ContentStatus.syncing,
      });
      groupStore.updateProfile(database, profile.groupId);
    },
    [],
  );

  return submitProfile;
};

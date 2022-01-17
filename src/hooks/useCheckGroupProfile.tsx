import React from 'react';
import { useStore } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import useSubmitPerson from 'hooks/useSubmitPerson';

export default () => {
  const { groupStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const submitPerson = useSubmitPerson();

  return React.useCallback(
    async (groupId) => {
      const group = groupStore.map[groupId];
      if (!group) {
        return;
      }
      try {
        const [profile, globalProfile] = await Promise.all([
          await PersonModel.getLatestProfile(database, {
            GroupId: groupId,
            Publisher: group.user_pubkey,
          }),
          await globalProfileModel.get(offChainDatabase),
        ]);

        const profileUpdateTime = profile
          ? profile.time / 1000000
          : -1;
        const globalProfileUpdateTime = globalProfile?.time ?? 0;
        const skip = !globalProfile || profileUpdateTime > globalProfileUpdateTime;

        if (skip) {
          return;
        }

        await submitPerson({
          groupId,
          publisher: group.user_pubkey,
          profile: globalProfile.profile,
        });
      } catch (err) {
        console.error(err);
      }
    },
    [],
  );
};

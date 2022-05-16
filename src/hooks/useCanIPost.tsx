import React from 'react';
import { useStore } from 'store';
import useCheckPermission from 'hooks/useCheckPermission';
import { lang } from 'utils/lang';
import { GroupStatus } from 'apis/group';

export default () => {
  const { snackbarStore, groupStore } = useStore();
  const checkPermission = useCheckPermission();

  return React.useCallback(async (groupId: string, options?: {
    ignoreGroupStatus: boolean
  }) => {
    const group = groupStore.map[groupId];
    if (!group) {
      snackbarStore.show({
        message: lang.notFound(lang.group),
        type: 'error',
      });
      throw new Error(lang.beBannedTip);
    }

    if (!options || !options.ignoreGroupStatus) {
      if (group.group_status === GroupStatus.SYNC_FAILED) {
        snackbarStore.show({
          message: lang.syncFailedTipForSubmit,
          type: 'error',
        });
        throw new Error(lang.syncFailedTipForSubmit);
      }
    }

    if (!await checkPermission(
      {
        groupId: group.group_id,
        publisher: group.user_pubkey,
        trxType: 'POST',
      },
    )) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
      });
      throw new Error(lang.beBannedTip);
    }
  }, []);
};

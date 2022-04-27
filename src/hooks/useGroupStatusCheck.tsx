import { GroupStatus } from 'apis/group';
import React from 'react';
import { useStore } from 'store';
import { lang } from 'utils/lang';

interface CustomMessage {
  [GroupStatus.SYNCING]: string
  [GroupStatus.SYNC_FAILED]: string
}

export default () => {
  const { groupStore, snackbarStore } = useStore();

  const check = React.useCallback(
    (groupId: string, showSnack: boolean = true, customMessage?: CustomMessage) => {
      const group = groupStore.map[groupId];
      if (!group) {
        return false;
      }

      if (group.group_status === GroupStatus.IDLE) {
        return true;
      }

      if (showSnack) {
        const message = (customMessage ?? {
          [GroupStatus.SYNCING]: lang.waitForSyncingDoneToSubmit,
          [GroupStatus.SYNC_FAILED]: lang.syncFailedTipForSubmit,
        })[group.group_status];

        snackbarStore.show({
          message,
          type: 'error',
        });
      }

      return false;
    },
    [],
  );

  return check;
};

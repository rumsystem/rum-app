import React from 'react';
import { useStore } from 'store';
import { sum } from 'lodash';
import { ipcRenderer } from 'electron';

export default () => {
  const { groupStore, latestStatusStore, nodeStore } = useStore();
  const { ids } = groupStore;
  const badgeCount = sum(
    ids.map(
      (groupId: string) => {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        return latestStatus.unreadCount + sum(Object.values(latestStatus.notificationUnreadCountMap || {}));
      },
    ),
  );

  React.useEffect(() => {
    ipcRenderer.send('set-badge-count', nodeStore.connected ? badgeCount : 0);
  }, [badgeCount, nodeStore.connected]);
};

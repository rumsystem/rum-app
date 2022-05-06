import React from 'react';
import { useStore } from 'store';
import { sum } from 'lodash';
import { app } from '@electron/remote';

export default () => {
  if (!process.env.IS_ELECTRON) {
    return;
  }
  const { groupStore, latestStatusStore, nodeStore } = useStore();
  const { topIds } = groupStore;
  const badgeCount = sum(
    topIds.map(
      (groupId: string) => {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        return latestStatus.unreadCount + sum(Object.values(latestStatus.notificationUnreadCountMap || {}));
      },
    ),
  );

  React.useEffect(() => {
    app.setBadgeCount(nodeStore.connected ? badgeCount : 0);
  }, [badgeCount, nodeStore.connected]);
};

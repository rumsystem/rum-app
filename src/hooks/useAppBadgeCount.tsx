import { useStore } from 'store';
import { sum } from 'lodash';
import { app } from '@electron/remote';

export default () => {
  const { groupStore, latestStatusStore } = useStore();
  const { ids } = groupStore;
  const badgeCount = sum(
    ids.map(
      (groupId: string) => {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        return latestStatus.unreadCount + sum(Object.values(latestStatus.notificationUnreadCountMap || {}));
      },
    ),
  );
  app.setBadgeCount(badgeCount);
};

import { useStore } from 'store';
import { sum } from 'lodash';
import { app } from '@electron/remote';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default () => {
  const { groupStore } = useStore();
  const { ids, latestStatusMap } = groupStore;
  const badgeCount = sum(
    ids.map(
      (groupId: string) => {
        const latestStatus = latestStatusMap[groupId] || DEFAULT_LATEST_STATUS;
        return latestStatus.unreadCount + sum(Object.values(latestStatus.notificationUnreadCountMap || {}));
      },
    ),
  );
  app.setBadgeCount(badgeCount);
};

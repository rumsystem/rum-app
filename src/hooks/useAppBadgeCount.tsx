import { useStore } from 'store';
import { sum } from 'lodash';
import { app } from '@electron/remote';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default () => {
  const { groupStore } = useStore();
  const { ids, latestStatusMap } = groupStore;
  const badgeCount = sum(
    ids.map(
      (groupId: string) =>
        (latestStatusMap[groupId] || DEFAULT_LATEST_STATUS).unreadCount,
    ),
  );
  app.setBadgeCount(badgeCount);
};

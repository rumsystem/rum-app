import { useStore } from 'store';
import { sum } from 'lodash';
import { remote } from 'electron';

export default () => {
  const { groupStore } = useStore();
  const { safeLatestStatusMap } = groupStore;
  const badgeCount = sum(
    Object.values(safeLatestStatusMap).map(
      (latestStatus) => latestStatus.unreadCount
    )
  );
  remote.app.setBadgeCount(badgeCount);
};

import { useStore } from 'store';
import { sum } from 'lodash';
import { remote } from 'electron';

export default () => {
  const { groupStore } = useStore();
  const { latestStatusMap } = groupStore;
  const badgeCount = sum(
    Object.values(latestStatusMap).map(
      (latestStatus) => latestStatus.unreadCount
    )
  );
  remote.app.setBadgeCount(badgeCount);
};

import { useStore } from 'store';
import { sum } from 'lodash';
import { remote } from 'electron';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default () => {
  const { groupStore } = useStore();
  const { latestStatusMap } = groupStore;
  const badgeCount = sum(
    Object.values(latestStatusMap).map(
      (latestStatus) => (latestStatus || DEFAULT_LATEST_STATUS).unreadCount
    )
  );
  remote.app.setBadgeCount(badgeCount);
};

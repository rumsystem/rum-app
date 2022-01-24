import { useStore } from 'store';
import { sum } from 'lodash';
import { remote } from 'electron';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default () => {
  const { groupStore } = useStore();
  const { ids, latestStatusMap } = groupStore;
  const badgeCount = sum(
    ids.map(
      (groupId: string) =>
        (latestStatusMap[groupId] || DEFAULT_LATEST_STATUS).unreadCount
    )
  );
  remote.app.setBadgeCount(badgeCount);
};

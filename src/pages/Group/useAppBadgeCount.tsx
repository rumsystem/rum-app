import { useStore } from 'store';
import { sum } from 'lodash';
import { remote } from 'electron';

export default () => {
  const { groupStore } = useStore();
  const { unReadCountMap } = groupStore;
  const badgeCount = sum(Object.values(unReadCountMap));
  remote.app.setBadgeCount(badgeCount);
};

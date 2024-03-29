import { store } from 'store';
import { IGroup, GroupUpdatedStatus } from 'apis/group';
import { differenceInSeconds, differenceInHours } from 'date-fns';
import getTimestampFromBlockTime from 'utils/getTimestampFromBlockTime';

const getUpdatedStatus = (latestUpdated: number) => {
  if (differenceInSeconds(Date.now(), new Date(latestUpdated)) < 60) {
    return GroupUpdatedStatus.ACTIVE;
  } if (differenceInHours(Date.now(), new Date(latestUpdated)) < 24) {
    return GroupUpdatedStatus.RECENTLY;
  }
  return GroupUpdatedStatus.SLEEPY;
};

export default (groups: IGroup[]) => {
  const { latestStatusStore, groupStore } = store;
  const derivedGroups = (groups ?? []).map((group) => {
    const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
    group.updatedStatus = getUpdatedStatus(Math.max(latestStatus.lastUpdated || 0, getTimestampFromBlockTime(group.last_updated)));
    return group;
  });
  groupStore.addGroups(derivedGroups);
};

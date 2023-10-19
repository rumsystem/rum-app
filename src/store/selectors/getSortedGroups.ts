import { IGroup } from 'apis/group';
import { ILatestStatusMap, DEFAULT_LATEST_STATUS } from 'hooks/useDatabase/models/latestStatus';

export default (groups: IGroup[], latestStatusMap: ILatestStatusMap) => groups.sort((a, b) => {
  const aStatus = latestStatusMap[a.group_id] || DEFAULT_LATEST_STATUS;
  const bStatus = latestStatusMap[b.group_id] || DEFAULT_LATEST_STATUS;
  const aTimeStamp = aStatus.latestObjectTimeStamp;
  const bTimeStamp = bStatus.latestObjectTimeStamp;
  if (aTimeStamp === 0) {
    return 1;
  }
  return bTimeStamp - aTimeStamp;
});

import sleep from 'utils/sleep';
import { GroupStatus } from 'apis/group';
import { store } from 'store';
import fetchGroups from 'hooks/fetchGroups';

const INACTIVE_ADDITIONAL_INTERVAL = 4000;
const ACTIVE_ADDITIONAL_INTERVAL = 2000;

export const groups = async () => {
  const { groupStore, activeGroupStore, nodeStore } = store;

  if (!nodeStore.quitting) {
    await fetchGroups();
    const busy = activeGroupStore.id
      && groupStore.map[activeGroupStore.id].group_status
      === GroupStatus.SYNCING;
    await sleep(busy ? ACTIVE_ADDITIONAL_INTERVAL : INACTIVE_ADDITIONAL_INTERVAL);
  }
};

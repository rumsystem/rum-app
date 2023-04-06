import sleep from 'utils/sleep';
import { GroupStatus } from 'apis/group';
import { store } from 'store';
import fetchGroups from 'hooks/fetchGroups';

const INTERVAL = 4000;

export const groups = async () => {
  const { groupStore, activeGroupStore, nodeStore } = store;

  await sleep(3000);
  while (!stop && !nodeStore.quitting) {
    await fetchGroups();
    const busy = activeGroupStore.id
      && groupStore.map[activeGroupStore.id].group_status
      === GroupStatus.SYNCING;
    await sleep(INTERVAL * (busy ? 1 / 2 : 2));
  }
};

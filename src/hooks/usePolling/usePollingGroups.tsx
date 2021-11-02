import React from 'react';
import { sleep } from 'utils';
import GroupApi, { GroupStatus } from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, activeGroupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(3000);
      while (!stop && !nodeStore.quitting) {
        await fetchGroups();
        const busy = activeGroupStore.id
          && groupStore.map[activeGroupStore.id].GroupStatus
            === GroupStatus.GROUP_SYNCING;
        await sleep(duration * (busy ? 1 / 2 : 2));
      }
    })();

    async function fetchGroups() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        for (const group of groups || []) {
          groupStore.updateGroup(group.GroupId, group);
        }
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

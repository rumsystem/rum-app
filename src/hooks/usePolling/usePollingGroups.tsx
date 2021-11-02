import React from 'react';
import sleep from 'utils/sleep';
import GroupApi, { GroupStatus } from 'apis/group';
import { useStore } from 'store';
import { runInAction } from 'mobx';

export default (duration: number) => {
  const { groupStore, activeGroupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(3000);
      while (!stop && !nodeStore.quitting) {
        await fetchGroups();
        const busy = activeGroupStore.id
          && groupStore.map[activeGroupStore.id].group_status
            === GroupStatus.SYNCING;
        await sleep(duration * (busy ? 1 / 2 : 2));
      }
    })();

    async function fetchGroups() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        runInAction(() => {
          for (const group of groups || []) {
            try {
              groupStore.updateGroup(group.group_id, group);
            } catch (err) {}
          }
        });
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

import React from 'react';
import sleep from 'utils/sleep';
import { GroupStatus } from 'apis/group';
import { useStore } from 'store';
import useFetchGroups from 'hooks/useFetchGroups';

export default (duration: number) => {
  const { groupStore, activeGroupStore, nodeStore } = useStore();
  const fetchGroups = useFetchGroups();

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

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

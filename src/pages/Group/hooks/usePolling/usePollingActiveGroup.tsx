import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, activeGroupStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(3000);
      while (!stop) {
        await fetchActiveGroup();
        await sleep(duration);
      }
    })();

    async function fetchActiveGroup() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        const group = (groups || []).find(
          (group) => group.GroupId === activeGroupStore.id
        );
        if (group) {
          groupStore.updateGroup(activeGroupStore.id, group);
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

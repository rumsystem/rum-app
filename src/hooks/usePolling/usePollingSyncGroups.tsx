import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';

export default (interval: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      while (!stop && !nodeStore.quitting) {
        await syncAllGroups();
        await sleep(interval);
      }
    })();

    async function syncAllGroups() {
      await Promise.all(
        Object.keys(groupStore.map).map(async (groupId) => {
          await groupStore.syncGroup(groupId);
        }),
      );
    }

    return () => {
      stop = true;
    };
  }, [groupStore, interval]);
};

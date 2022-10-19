import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let errorCount = 0;

    (async () => {
      await sleep(4000);
      while (!stop) {
        await fetchMyNodeInfo();
        await sleep(duration);
      }
    })();

    async function fetchMyNodeInfo() {
      try {
        const info = await GroupApi.fetchMyNodeInfo();
        nodeStore.updateStatus(info.node_status);
        errorCount = 0;
      } catch (err) {
        if (errorCount > 0) {
          nodeStore.updateStatus('NODE_OFFLINE');
        }
        errorCount++;
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

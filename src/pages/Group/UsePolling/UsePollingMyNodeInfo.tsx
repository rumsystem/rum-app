import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let errorCount = 0;
    const DURATION_4_SECONDS = 4 * 1000;

    (async () => {
      await sleep(1000);
      while (!stop) {
        await fetchMyNodeInfo();
        await sleep(DURATION_4_SECONDS);
      }
    })();

    async function fetchMyNodeInfo() {
      if (!groupStore.isSelected) {
        return;
      }
      try {
        const nodeInfo = await GroupApi.fetchMyNodeInfo();
        groupStore.updateNodeStatus(nodeInfo.node_status);
        errorCount = 0;
      } catch (err) {
        if (errorCount > 0) {
          groupStore.updateNodeStatus('NODE_OFFLINE');
        }
        errorCount++;
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};

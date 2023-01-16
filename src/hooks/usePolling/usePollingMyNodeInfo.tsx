import React from 'react';
import sleep from 'utils/sleep';
import NodeApi from 'apis/node';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import { BOOTSTRAPS } from 'utils/constant';

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let errorCount = 0;

    (async () => {
      await sleep(4000);
      while (!stop && !nodeStore.quitting) {
        await fetchMyNodeInfo();
        await sleep(duration);
      }
    })();

    async function fetchMyNodeInfo() {
      try {
        const info = await NodeApi.fetchMyNodeInfo();
        nodeStore.updateStatus(info.node_status);
        errorCount = 0;
        nodeStore.setConnected(true);
        (window as any).Quorum = Quorum;
      } catch (err) {
        if (errorCount > 0 && nodeStore.connected) {
          nodeStore.setConnected(false);
          if (nodeStore.mode === 'INTERNAL') {
            Quorum.down();
            await sleep(2000);
            console.log('Restarting node');
            const { data } = await Quorum.up({
              bootstraps: BOOTSTRAPS,
              storagePath: nodeStore.storagePath,
              password: localStorage.getItem(`p${nodeStore.storagePath}`) || nodeStore.password,
            });
            const status = {
              ...data,
              logs: '',
            };
            console.log('NODE_STATUS', status);
            nodeStore.setStatus(status);
            nodeStore.setApiConfig({
              port: String(status.port),
              cert: status.cert,
              host: nodeStore.apiConfig.host || '',
              jwt: nodeStore.apiConfig.jwt || '',
            });
          }
        }
        errorCount += 1;
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

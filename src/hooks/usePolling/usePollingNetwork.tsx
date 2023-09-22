import React from 'react';
import sleep from 'utils/sleep';
import NodeApi from 'apis/node';
import NetworkApi from 'apis/network';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(4000);
      while (!stop && !nodeStore.quitting) {
        await fetchNetwork();
        await sleep(duration);
      }
    })();

    async function fetchNetwork() {
      try {
        const [info, network] = await Promise.all([
          NodeApi.fetchMyNodeInfo(),
          NetworkApi.fetchNetwork(),
        ]);

        nodeStore.setInfo(info);
        nodeStore.setNetwork(network);
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

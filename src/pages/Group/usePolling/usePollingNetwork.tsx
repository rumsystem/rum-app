import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop) {
        await fetchNetwork();
        await sleep(duration);
      }
    })();

    async function fetchNetwork() {
      if (!groupStore.isSelected) {
        return;
      }
      try {
        const network = await GroupApi.fetchNetwork();
        nodeStore.setNetwork(network);
      } catch (err) {
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

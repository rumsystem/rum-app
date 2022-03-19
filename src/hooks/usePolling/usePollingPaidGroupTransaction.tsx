import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';

export default (duration: number) => {
  const { nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await fetchPaiGroupTransactions();
      }
    })();

    async function fetchPaiGroupTransactions() {
      try {
        await sleep(500);
        console.log(' ------------- fetchPaiGroupTransactions ---------------');
      } catch (err) {}
    }

    return () => {
      stop = true;
    };
  }, []);
};

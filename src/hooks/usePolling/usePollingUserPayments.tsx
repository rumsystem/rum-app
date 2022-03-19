import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';

export default (duration: number) => {
  const { nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      const isAnnouncedUser = true;
      while (!stop && !nodeStore.quitting) {
        if (!isAnnouncedUser) {
          return;
        }
        await sleep(duration);
        await fetchUserPayments();
      }
    })();

    async function fetchUserPayments() {
      try {
        await sleep(500);
        console.log(' ------------- fetchUserPayments ---------------');
      } catch (err) {}
    }

    return () => {
      stop = true;
    };
  }, []);
};

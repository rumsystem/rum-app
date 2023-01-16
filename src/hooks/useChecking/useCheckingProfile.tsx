import React from 'react';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();
  const database = useDatabase();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(3000);
      while (!stop && !nodeStore.quitting) {
        groupStore.checkProfile(database);
        await sleep(duration);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

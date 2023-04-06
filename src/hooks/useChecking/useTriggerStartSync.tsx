import React from 'react';
import sleep from 'utils/sleep';
import { store } from 'store';

export default (duration: number) => {
  React.useEffect(() => {
    let stop = false;

    (async () => {
      while (!stop && !store.nodeStore.quitting) {
        await triggerStartSync();
        await sleep(duration);
      }
    })();

    async function triggerStartSync() {
      try {
        const groups = store.groupStore.groups;
        for (const group of groups) {
          await sleep(10 * 1000);
          try {
            store.groupStore.syncGroup(group.group_id);
          } catch (err) {
            console.log(err);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

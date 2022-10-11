import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';

export default (duration: number) => {
  const { nodeStore, groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      while (!stop && !nodeStore.quitting) {
        await triggerStartSync();
        await sleep(duration);
      }
    })();

    async function triggerStartSync() {
      try {
        const groups = groupStore.groups;
        for (const group of groups) {
          await sleep(10 * 1000);
          try {
            groupStore.syncGroup(group.group_id);
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

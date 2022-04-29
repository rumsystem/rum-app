import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { useJoinGroup } from 'hooks/useJoinGroup';

export default (duration: number) => {
  const { nodeStore, groupStore } = useStore();
  const joinGroup = useJoinGroup();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await check();
      }
    })();

    async function check() {
      const { notOwnGroups } = groupStore;
      for (const group of notOwnGroups) {
        const subConfig = groupStore.topToSubConfigMap[group.group_id];
        if (subConfig) {
          const subGroupSeeds = Object.values(subConfig);
          for (const seed of subGroupSeeds) {
            if (!groupStore.map[seed.group_id]) {
              try {
                await joinGroup(seed, {
                  silent: true,
                });
              } catch (err) {
                console.log(err);
              }
            }
          }
        }
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

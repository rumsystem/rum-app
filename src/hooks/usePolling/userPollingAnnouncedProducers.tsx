import React from 'react';
import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const store = useStore();
  const { groupStore, nodeStore } = store;

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1500);
      while (!stop && !nodeStore.quitting) {
        fetch();
        await sleep(duration);
      }
    })();

    async function fetch() {
      try {
        const groups = groupStore.ownGroups;
        for (let i = 0; i < groups.length;) {
          const start = i;
          const end = i + 5;
          await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchAnnouncedProducers(group.group_id)),
          );
          i = end;
          await sleep(100);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchAnnouncedProducers(groupId: string) {
      try {
        const producers = await GroupApi.fetchAnnouncedProducers(groupId);
        const hasAnnouncedProducers = producers.filter((producer) => producer.Result === 'ANNOUNCED').length > 0;
        groupStore.setHasAnnouncedProducersMap(groupId, hasAnnouncedProducers);
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

import React from 'react';
import sleep from 'utils/sleep';
import ProducerApi from 'apis/producer';
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
          const end = i + 3;
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
        const approvedProducers = await ProducerApi.fetchApprovedProducers(groupId);
        const approvedProducerPubKeys = approvedProducers.map((producer) => producer.ProducerPubkey);
        const announcedProducersRes = await ProducerApi.fetchAnnouncedProducers(groupId);
        const announcedProducers = announcedProducersRes.filter((producer) => producer.Result === 'ANNOUNCED' && (producer.Action === 'ADD' || (producer.Action === 'REMOVE' && approvedProducerPubKeys.includes(producer.AnnouncedPubkey))));
        groupStore.setHasAnnouncedProducersMap(groupId, announcedProducers.length > 0);
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

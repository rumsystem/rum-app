import sleep from 'utils/sleep';
import ProducerApi from 'apis/producer';
import { store } from 'store';
import { differenceInMinutes } from 'date-fns';

export const getAnouncedProducers = () => {
  let unActiveGroupsFetchedAt = Date.now();

  return async () => {
    const { groupStore, nodeStore, activeGroupStore } = store;

    while (!stop && !nodeStore.quitting) {
      fetch();
      await sleep(1500);
    }

    async function fetch() {
      try {
        const shouldFetchUnActiveGroups = differenceInMinutes(Date.now(), unActiveGroupsFetchedAt) > 30;
        if (shouldFetchUnActiveGroups) {
          unActiveGroupsFetchedAt = Date.now();
        }
        const groups = groupStore.ownGroups.filter((group) => shouldFetchUnActiveGroups || group.group_id === activeGroupStore.id);
        for (let i = 0; i < groups.length;) {
          const start = i;
          const end = i + 5;
          await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchAnnouncedProducers(group.group_id)),
          );
          i = end;
          await sleep(5000);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchAnnouncedProducers(groupId: string) {
      try {
        const approvedProducers = await ProducerApi.fetchApprovedProducers(groupId) || [];
        const approvedProducerPubKeys = approvedProducers.map((producer) => producer.ProducerPubkey);
        const announcedProducersRes = await ProducerApi.fetchAnnouncedProducers(groupId);
        const announcedProducers = announcedProducersRes.filter((producer) => producer.Result === 'ANNOUNCED' && (producer.Action === 'ADD' || (producer.Action === 'REMOVE' && approvedProducerPubKeys.includes(producer.AnnouncedPubkey))));
        groupStore.setHasAnnouncedProducersMap(groupId, announcedProducers.length > 0);
      } catch (err) {
        console.error(err);
      }
    }
  };
};

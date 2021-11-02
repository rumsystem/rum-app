import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { activeGroupStore, groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1500);
      while (!stop) {
        await fetchPreviousContents();
        await sleep(duration);
      }
    })();

    async function fetchPreviousContents() {
      if (!activeGroupStore.isActive) {
        return;
      }

      try {
        const contents = await GroupApi.fetchContents(activeGroupStore.id);
        if (!contents || contents.length === 0) {
          return;
        }
        const previousContents = contents
          .filter(
            (content) =>
              activeGroupStore.rearContentTimeStamp === 0 ||
              content.TimeStamp < activeGroupStore.rearContentTimeStamp
          )
          .sort((a, b) => b.TimeStamp - a.TimeStamp);
        if (previousContents.length > 0) {
          if (activeGroupStore.contentTotal === 0) {
            const latestContent = previousContents[0];
            groupStore.setLatestContentTimeStamp(
              activeGroupStore.id,
              latestContent.TimeStamp
            );
          }
          activeGroupStore.addContents(previousContents);
          const earliestContent = previousContents[previousContents.length - 1];
          activeGroupStore.setRearContentTimeStamp(earliestContent.TimeStamp);
        }
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [activeGroupStore, groupStore, duration]);
};

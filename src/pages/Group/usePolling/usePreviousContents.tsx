import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore } = useStore();

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
      if (!groupStore.isSelected) {
        return;
      }

      try {
        const contents = await GroupApi.fetchContents(groupStore.id);
        if (!contents || contents.length === 0) {
          return;
        }
        const previousContents = contents.filter(
          (content) =>
            groupStore.currentGroupEarliestContentTimeStamp === 0 ||
            content.TimeStamp < groupStore.currentGroupEarliestContentTimeStamp
        );
        if (previousContents.length > 0) {
          groupStore.addContents(previousContents);
        }
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

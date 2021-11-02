import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    const DURATION_12_SECONDS = 12 * 1000;

    (async () => {
      await sleep(1500);
      while (!stop) {
        await fetchGroupUnReadCount();
        await sleep(DURATION_12_SECONDS);
      }
    })();

    async function fetchGroupUnReadCount() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        if (!groups || groups.length === 0) {
          return;
        }
        for (const group of groups.filter(
          (group) => group.GroupId !== groupStore.id
        )) {
          const contents = await GroupApi.fetchContents(group.GroupId);
          if (!contents || contents.length === 0) {
            return;
          }
          const unReadContents = contents.filter(
            (content) =>
              content.TimeStamp >
                groupStore.lastReadContentTimeStampMap[group.GroupId] || 0
          );
          groupStore.updateUnReadCountMap(group.GroupId, unReadContents.length);
        }
      } catch (err) {
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};

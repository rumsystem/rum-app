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
        await fetchGroupUnReadCount();
        await sleep(duration);
      }
    })();

    async function fetchGroupUnReadCount() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        if (!groups || groups.length === 0) {
          return;
        }
        for (let i = 0; i < groups.length; ) {
          const start = i;
          const end = i + 3;
          await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.GroupId))
          );
          i = end;
        }
      } catch (err) {
        console.log(err.message);
      }

      async function fetchContentsTask(groupId: string) {
        const contents = await GroupApi.fetchContents(groupId);
        if (!contents || contents.length === 0) {
          return;
        }
        const unReadContents = contents.filter(
          (content) =>
            content.TimeStamp >
              groupStore.groupsLastContentTimeStampMap[groupId] || 0
        );
        groupStore.updateUnReadCountMap(groupId, unReadContents.length);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};

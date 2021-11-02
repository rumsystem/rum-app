import React from 'react';
import { sleep } from 'utils';
import GroupApi, { IObjectItem, IPersonItem, ContentTypeUrl } from 'apis/group';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import { groupBy } from 'lodash';

export default (duration: number) => {
  const store = useStore();
  const { groupStore } = store;

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
          await sleep(400);
        }
      } catch (err) {
        console.error(err);
      }

      async function fetchContentsTask(groupId: string) {
        const latestStatus = groupStore.latestStatusMap[groupId];
        const contents = await GroupApi.fetchContents(groupId, {
          num: 20,
          starttrx: latestStatus ? latestStatus.latestTrxId : '',
        });

        if (!contents || contents.length === 0) {
          return;
        }

        const contentsByType = groupBy(contents, 'TypeUrl');

        await handleObjects(
          groupId,
          contentsByType[ContentTypeUrl.Object] as IObjectItem[],
          store
        );
        await handlePersons(
          groupId,
          contentsByType[ContentTypeUrl.Person] as IPersonItem[]
        );

        const latestContent = contents[contents.length - 1];
        groupStore.updateLatestStatusMap(groupId, {
          latestTrxId: latestContent.TrxId,
          latestTimeStamp: latestContent.TimeStamp,
        });
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

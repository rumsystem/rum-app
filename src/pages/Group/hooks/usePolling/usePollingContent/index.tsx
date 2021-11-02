import React from 'react';
import { sleep } from 'utils';
import GroupApi, { IObjectItem, IPersonItem, ContentTypeUrl } from 'apis/group';
import { ContentStatus } from 'store/database';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import { groupBy } from 'lodash';

const OBJECTS_LIMIT = 100;

export default (duration: number) => {
  const store = useStore();
  const { groupStore, activeGroupStore } = store;

  React.useEffect(() => {
    let stop = false;
    let busy = false;

    (async () => {
      await sleep(1500);
      while (!stop) {
        if (activeGroupStore.id) {
          const contents = await fetchContentsTask(activeGroupStore.id);
          busy =
            (!!contents && contents.length === OBJECTS_LIMIT) ||
            (activeGroupStore.frontObject &&
              activeGroupStore.frontObject.Status === ContentStatus.Syncing);
        }
        await sleep(duration * (busy ? 1 / 2 : 1));
      }
    })();

    (async () => {
      await sleep(2000);
      while (!stop) {
        await fetchUnActiveContents();
        await sleep(duration * 2);
      }
    })();

    async function fetchUnActiveContents() {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        if (!groups || groups.length === 0) {
          return;
        }
        const sortedGroups = groups
          .filter((group) => group.GroupId !== activeGroupStore.id)
          .sort((a, b) => b.LastUpdate - a.LastUpdate);
        for (let i = 0; i < sortedGroups.length; ) {
          const start = i;
          const end = i + 5;
          await Promise.all(
            sortedGroups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.GroupId))
          );
          i = end;
          await sleep(100);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchContentsTask(groupId: string) {
      const latestStatus = groupStore.safeLatestStatusMap[groupId];
      const contents = await GroupApi.fetchContents(groupId, {
        num: OBJECTS_LIMIT,
        starttrx: latestStatus.latestTrxId || '',
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
        contentsByType[ContentTypeUrl.Person] as IPersonItem[],
        store
      );

      const latestContent = contents[contents.length - 1];
      groupStore.updateLatestStatusMap(groupId, {
        latestTrxId: latestContent.TrxId,
        latestTimeStamp: latestContent.TimeStamp,
      });

      return contents;
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

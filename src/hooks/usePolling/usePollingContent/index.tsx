import React from 'react';
import sleep from 'utils/sleep';
import ContentApi, {
  IObjectItem,
  IPersonItem,
  ContentTypeUrl,
} from 'apis/content';
import {
  GroupStatus,
} from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import handleComments from './handleComments';

const DEFAULT_OBJECTS_LIMIT = 200;

export default (duration: number) => {
  const store = useStore();
  const { groupStore, activeGroupStore, nodeStore, latestStatusStore } = store;
  const database = useDatabase();

  React.useEffect(() => {
    let stop = false;
    let activeGroupIsBusy = false;

    (async () => {
      await sleep(1500);
      while (!stop && !nodeStore.quitting) {
        if (activeGroupStore.id) {
          console.log(' ------------- 当前开始 ---------------');
          const contents = await fetchContentsTask(activeGroupStore.id, DEFAULT_OBJECTS_LIMIT);
          console.log(' ------------- 当前结束 ---------------');
          activeGroupIsBusy = (!!contents && contents.length === DEFAULT_OBJECTS_LIMIT)
            || (!!activeGroupStore.frontObject
              && activeGroupStore.frontObject.Status === ContentStatus.syncing);
        }
        const waitTime = activeGroupIsBusy ? 0 : duration;
        await sleep(waitTime);
      }
    })();

    (async () => {
      await sleep(5000);
      console.log(' ------------- hard code: ---------------');
      while (!stop && nodeStore.quitting) {
        const activeGroup = groupStore.map[activeGroupStore.id] || {};
        const activeGroupSyncing = activeGroup.group_status === GroupStatus.SYNCING;
        console.log(' ------------- 其他开始 ---------------');
        await fetchUnActiveContents(activeGroupSyncing ? 20 : DEFAULT_OBJECTS_LIMIT / 2);
        console.log(' ------------- 其他结束 ---------------');
        await sleep(duration * 2);
        if (activeGroupSyncing) {
          await sleep(duration * 5);
          if (activeGroupIsBusy) {
            await sleep(duration * 5);
          }
        }
      }
    })();

    async function fetchUnActiveContents(limit: number) {
      try {
        const sortedGroups = groupStore.groups
          .filter((group) => group.group_id !== activeGroupStore.id)
          .sort((a, b) => b.last_updated - a.last_updated);
        for (let i = 0; i < sortedGroups.length;) {
          const start = i;
          const end = i + 5;
          await Promise.all(
            sortedGroups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.group_id, limit)),
          );
          i = end;
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchContentsTask(groupId: string, limit: number) {
      try {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        const contents = await ContentApi.fetchContents(groupId, {
          num: limit,
          starttrx: latestStatus.latestTrxId,
        });

        if (!contents || contents.length === 0) {
          return;
        }

        await handleObjects({
          groupId,
          objects: contents.filter(
            (v) => v.TypeUrl === ContentTypeUrl.Object && !('inreplyto' in v.Content),
          ) as Array<IObjectItem>,
          store,
          database,
        });
        await handleComments({
          groupId,
          objects: contents.filter(
            (v) => v.TypeUrl === ContentTypeUrl.Object && 'inreplyto' in v.Content,
          ) as Array<IObjectItem>,
          store,
          database,
        });
        await handlePersons({
          groupId,
          persons: contents.filter((v) => v.TypeUrl === ContentTypeUrl.Person) as Array<IPersonItem>,
          store,
          database,
        });

        const latestContent = contents[contents.length - 1];
        latestStatusStore.updateMap(database, groupId, {
          latestTrxId: latestContent.TrxId,
          latestTimeStamp: latestContent.TimeStamp,
        });

        return contents;
      } catch (err) {
        console.error(err);
        return [];
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

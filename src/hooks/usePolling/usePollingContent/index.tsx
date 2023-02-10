import React from 'react';
import sleep from 'utils/sleep';
import ContentApi, {
  IObjectItem,
  IPersonItem,
  ContentTypeUrl,
} from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import handleComments from './handleComments';

const OBJECTS_LIMIT = 100;

export default (duration: number) => {
  const store = useStore();
  const { groupStore, activeGroupStore, nodeStore, latestStatusStore } = store;
  const database = useDatabase();

  React.useEffect(() => {
    let stop = false;
    let busy = false;

    (async () => {
      await sleep(1500);
      while (!stop && !nodeStore.quitting) {
        if (activeGroupStore.id) {
          const contents = await fetchContentsTask(activeGroupStore.id);
          busy = (!!contents && contents.length === OBJECTS_LIMIT)
            || (!!activeGroupStore.frontObject
              && activeGroupStore.frontObject.Status === ContentStatus.syncing);
        }
        const waitTime = busy ? 0 : duration;
        await sleep(waitTime);
      }
    })();

    (async () => {
      await sleep(2000);
      while (!stop && !nodeStore.quitting) {
        await fetchUnActiveContents();
        await sleep(duration * 2);
      }
    })();

    async function fetchUnActiveContents() {
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
              .map((group) => fetchContentsTask(group.group_id)),
          );
          i = end;
          await sleep(100);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchContentsTask(groupId: string) {
      try {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        const contents = await ContentApi.fetchContents(groupId, {
          num: OBJECTS_LIMIT,
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

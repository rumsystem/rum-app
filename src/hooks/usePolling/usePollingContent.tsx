import React from 'react';
import sleep from 'utils/sleep';
import ContentApi, {
  IContentItem,
} from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import * as ContentModel from 'hooks/useDatabase/models/content';

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
          const contents = await fetchContentsTask(activeGroupStore.id, DEFAULT_OBJECTS_LIMIT * 2);
          activeGroupIsBusy = !!contents && contents.length > DEFAULT_OBJECTS_LIMIT;
          const waitingForSync = !!activeGroupStore.frontObject
          && activeGroupStore.frontObject.Status === ContentStatus.syncing;
          await sleep(waitingForSync ? duration / 2 : duration);
        } else {
          await sleep(duration);
        }
      }
    })();

    (async () => {
      await sleep(5000);
      while (!stop && !nodeStore.quitting) {
        if (!activeGroupIsBusy) {
          await fetchUnActiveContents(DEFAULT_OBJECTS_LIMIT);
        }
        await sleep(duration * 2);
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

        const newContents = contents.map((content: IContentItem) => ({
          ...content,
          GroupId: groupId,
        }));
        await ContentModel.bulkCreate(database, newContents);
        console.log({ isActiveGroup: groupId === activeGroupStore.id, newContents });

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

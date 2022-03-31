import React from 'react';
import sleep from 'utils/sleep';
import ContentApi, {
  INoteItem,
  ILikeItem,
  IPersonItem,
  ContentTypeUrl,
  LikeType,
} from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import handleComments from './handleComments';
import handleLikes from './handleLikes';
import { flatten } from 'lodash';

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
          if (!activeGroupIsBusy) {
            await sleep(waitingForSync ? duration / 2 : duration);
          }
        } else {
          await sleep(duration);
        }
      }
    })();

    (async () => {
      await sleep(5000);
      while (!stop && !nodeStore.quitting) {
        if (!activeGroupIsBusy) {
          const contents = await fetchUnActiveContents(DEFAULT_OBJECTS_LIMIT);
          const busy = contents.length > DEFAULT_OBJECTS_LIMIT / 2;
          await sleep(busy ? 0 : duration);
        } else {
          await sleep(duration);
        }
      }
    })();

    async function fetchUnActiveContents(limit: number) {
      const contents = [];
      try {
        const sortedGroups = groupStore.groups
          .filter((group) => group.group_id !== activeGroupStore.id)
          .sort((a, b) => b.last_updated - a.last_updated);
        for (let i = 0; i < sortedGroups.length;) {
          const start = i;
          const end = i + 5;
          const res = await Promise.all(
            sortedGroups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.group_id, limit)),
          );
          contents.push(...flatten(res));
          i = end;
        }
      } catch (err) {
        console.error(err);
      }
      return contents;
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
            (v) => v.TypeUrl === ContentTypeUrl.Object && (v as INoteItem).Content.type === 'Note' && !('inreplyto' in v.Content),
          ) as Array<INoteItem>,
          store,
          database,
        });
        await handleComments({
          groupId,
          objects: contents.filter(
            (v) => v.TypeUrl === ContentTypeUrl.Object && (v as INoteItem).Content.type === 'Note' && 'inreplyto' in v.Content,
          ) as Array<INoteItem>,
          store,
          database,
        });
        await handleLikes({
          groupId,
          objects: contents.filter(
            (v) => v.TypeUrl === ContentTypeUrl.Object && [LikeType.Like, LikeType.Dislike].includes((v as ILikeItem).Content.type),
          ) as Array<ILikeItem>,
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

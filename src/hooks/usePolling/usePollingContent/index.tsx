import React from 'react';
import sleep from 'utils/sleep';
import GroupApi, {
  IObjectItem,
  IPersonItem,
  ContentTypeUrl,
} from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import handleObjects from './handleObjects';
import handlePersons from './handlePersons';
import handleComments from './handleComments';
import { groupBy } from 'lodash';

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
        await sleep(duration * (busy ? 1 / 2 : 1));
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
          .filter((group) => group.GroupId !== activeGroupStore.id)
          .sort((a, b) => b.LastUpdate - a.LastUpdate);
        for (let i = 0; i < sortedGroups.length;) {
          const start = i;
          const end = i + 5;
          await Promise.all(
            sortedGroups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.GroupId)),
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
        const contents = await GroupApi.fetchContents(groupId, {
          num: OBJECTS_LIMIT,
          starttrx: latestStatus.latestTrxId,
        });

        if (!contents || contents.length === 0) {
          return;
        }

        const contentsByType = groupBy(contents, 'TypeUrl');

        const isObject = (object: IObjectItem) => !object.Content.inreplyto;
        const isComment = (object: IObjectItem) => !!object.Content.inreplyto;

        await handleObjects({
          groupId,
          objects:
            ((contentsByType[ContentTypeUrl.Object] as IObjectItem[]) || []).filter(isObject),
          store,
          database,
        });
        await handleComments({
          groupId,
          objects:
            ((contentsByType[ContentTypeUrl.Object] as IObjectItem[]) || []).filter(isComment),
          store,
          database,
        });
        await handlePersons({
          groupId,
          persons:
            (contentsByType[ContentTypeUrl.Person] as IPersonItem[]) || [],
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

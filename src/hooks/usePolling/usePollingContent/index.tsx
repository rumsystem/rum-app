import React from 'react';
import sleep from 'utils/sleep';
import ContentApi, { IContentItem } from 'apis/content';
import { GroupUpdatedStatus } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { useStore } from 'store';
import handlePosts from './handlePosts';
import handlePostDelete from './handlePostDelete';
import handleProfiles from './handleProfiles';
import handleComments from './handleComments';
import handleImages from './handleImages';
import handleCounters from './handleCounters';
import handleRelations from './handleRelations';
import { flatten, uniqBy } from 'lodash';
import ContentDetector from 'utils/contentDetector';
import { format } from 'date-fns';

const DEFAULT_OBJECTS_LIMIT = 50;

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
          const waitingForSync = !!activeGroupStore.frontPost
          && activeGroupStore.frontPost.status === ContentStatus.syncing;
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
          await fetchBackgroundGroupsContents(DEFAULT_OBJECTS_LIMIT, GroupUpdatedStatus.ACTIVE);
        }
        await sleep(groupStore.groups.length > 10 ? 4000 : 2000);
      }
    })();

    (async () => {
      await sleep(30 * 1000);
      while (!stop && !nodeStore.quitting) {
        if (!activeGroupIsBusy) {
          await fetchBackgroundGroupsContents(DEFAULT_OBJECTS_LIMIT, GroupUpdatedStatus.RECENTLY);
        }
        await sleep(30 * 1000);
      }
    })();

    (async () => {
      await sleep(60 * 1000);
      while (!stop && !nodeStore.quitting) {
        if (!activeGroupIsBusy) {
          await fetchBackgroundGroupsContents(DEFAULT_OBJECTS_LIMIT, GroupUpdatedStatus.SLEEPY);
        }
        await sleep(5 * 60 * 1000);
      }
    })();

    async function fetchBackgroundGroupsContents(limit: number, groupUpdatedStatus: GroupUpdatedStatus) {
      const params = {
        per: 4,
        duration: 1000,
      };
      if (groupUpdatedStatus === GroupUpdatedStatus.ACTIVE) {
        params.per = 4;
        params.duration = 100;
      } else if (groupUpdatedStatus === GroupUpdatedStatus.RECENTLY) {
        params.per = 2;
        params.duration = 2000;
      } else if (groupUpdatedStatus === GroupUpdatedStatus.SLEEPY) {
        params.per = 1;
        params.duration = 2000;
      }
      const contents = [];
      try {
        const groups = groupStore.groups
          .filter((group) => group.group_id !== activeGroupStore.id && group.updatedStatus === groupUpdatedStatus);
        for (let i = 0; i < groups.length;) {
          const start = i;
          const end = i + params.per;
          const res = await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchContentsTask(group.group_id, limit)),
          );
          contents.push(...flatten(res));
          i = end;
          await sleep(params.duration * (groupStore.groups.length > 10 ? 3 : 1));
        }
      } catch (err) {
        console.error(err);
      }
      return contents;
    }

    async function fetchContentsTask(groupId: string, limit: number) {
      try {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        const rawContents = await ContentApi.fetchContents(groupId, {
          num: limit,
          starttrx: latestStatus.latestTrxId,
        }) || [];
        let contents = [...rawContents];

        if (contents.length === 0) {
          return;
        }

        const latestContent = contents[contents.length - 1];
        contents = uniqBy(contents, 'TrxId');
        contents = contents.sort((a, b) => a.TimeStamp - b.TimeStamp);

        await handlePosts({
          groupId,
          objects: contents.filter(ContentDetector.isPost),
          store,
          database,
        });
        await handlePostDelete({
          groupId,
          objects: contents.filter(ContentDetector.isPostDelete),
          store,
          database,
        });
        await handleComments({
          groupId,
          objects: contents.filter(ContentDetector.isComment),
          store,
          database,
        });
        await handleCounters({
          groupId,
          objects: contents.filter(ContentDetector.isCounter),
          store,
          database,
        });
        await handleRelations({
          groupId,
          objects: contents.filter(ContentDetector.isRelation),
          store,
          database,
        });
        await handleProfiles({
          groupId,
          objects: contents.filter(ContentDetector.isProfile),
          store,
          database,
        });
        await handleImages({
          groupId,
          objects: contents.filter(ContentDetector.isImage),
          store,
          database,
        });

        latestStatusStore.update(groupId, {
          latestTrxId: latestContent.TrxId,
          lastUpdated: Date.now(),
          recentContentLogs: [
            ...[...rawContents].reverse().map(getContentLog),
            ...latestStatus.recentContentLogs || [],
          ].slice(0, 210),
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

const getContentLog = (c: IContentItem) => {
  const content = (((c.Content || {}) as any).content || '').slice(0, 10) + '...';
  return `【${format(c.TimeStamp / 1000000, 'yyyy-MM-dd HH:mm:ss')}】${c.TrxId} ${content}`;
};

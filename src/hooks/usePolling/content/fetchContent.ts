import { format } from 'date-fns';
import { uniqBy } from 'lodash';
import ContentApi, { IContentItem } from 'apis/content';
import * as PendingTrxModel from 'hooks/useDatabase/models/pendingTrx';
import useDatabase from 'hooks/useDatabase';
import ContentDetector from 'utils/contentDetector';
import { store } from 'store';

import handlePosts from './handlePosts';
import handlePostDelete from './handlePostDelete';
import handleProfiles from './handleProfiles';
import handleComments from './handleComments';
import handleImages from './handleImages';
import handleCounters from './handleCounters';
import handleRelations from './handleRelations';

const DEFAULT_OBJECTS_LIMIT = 50;

export const fetchContentsTask = async (groupId: string, limit = DEFAULT_OBJECTS_LIMIT) => {
  const { latestStatusStore } = store;
  const database = useDatabase();

  try {
    const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
    const rawContents = await ContentApi.fetchContents(groupId, {
      num: limit,
      starttrx: latestStatus.latestTrxId,
    }) || [];
    let contents = [...rawContents];

    if (contents.length === 0) {
      return [];
    }

    const latestContent = contents[contents.length - 1];
    contents = uniqBy(contents, 'TrxId');
    contents = contents.sort((a, b) => a.TimeStamp - b.TimeStamp);

    const pendingTrxs = await PendingTrxModel.getByGroupId(database, groupId);

    const handleContents = async (contents: Array<IContentItem>) => {
      const list = [
        [handlePosts, contents.filter(ContentDetector.isPost)],
        [handlePostDelete, contents.filter(ContentDetector.isPostDelete)],
        [handleComments, contents.filter(ContentDetector.isComment)],
        [handleCounters, contents.filter(ContentDetector.isCounter)],
        [handleRelations, contents.filter(ContentDetector.isRelation)],
        [handleProfiles, contents.filter(ContentDetector.isProfile)],
        [handleImages, contents.filter(ContentDetector.isImage)],
      ] as const;
      for (const item of list) {
        const [fn, objects] = item;
        await fn({ groupId, store, database, objects, isPendingObjects: true });
      }
    };

    await handleContents(contents);
    await handleContents(pendingTrxs.map((v) => v.value));

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
};

const getContentLog = (c: IContentItem) => {
  const content = (((c.Content || {}) as any).content || '').slice(0, 10) + '...';
  return `【${format(c.TimeStamp / 1000000, 'yyyy-MM-dd HH:mm:ss')}】${c.TrxId} ${content}`;
};

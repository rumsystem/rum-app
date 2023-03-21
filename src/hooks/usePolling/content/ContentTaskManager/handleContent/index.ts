import { IContentItem } from 'apis/content';
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
import handleEmptyObjects from './handleEmptyObjects';

export const handleContents = async (groupId: string, contents: Array<IContentItem>) => {
  const database = useDatabase();
  const list = [
    [handlePosts, contents.filter(ContentDetector.isPost)],
    [handlePostDelete, contents.filter(ContentDetector.isPostDelete)],
    [handleComments, contents.filter(ContentDetector.isComment)],
    [handleCounters, contents.filter(ContentDetector.isCounter)],
    [handleRelations, contents.filter(ContentDetector.isRelation)],
    [handleProfiles, contents.filter(ContentDetector.isProfile)],
    [handleImages, contents.filter(ContentDetector.isImage)],
    [handleEmptyObjects, contents.filter(ContentDetector.isEmptyObject)],
  ] as const;
  for (const item of list) {
    const [fn, objects] = item;
    await fn({ groupId, store, database, objects, isPendingObjects: true });
  }
};

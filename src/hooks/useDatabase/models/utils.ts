import useDatabase from '..';

export const getHotCount = (options: {
  likeCount: number
  dislikeCount: number
  commentCount: number
}) => (options.likeCount - options.dislikeCount + options.commentCount * 0.4) * 10;

export const removeGroupFromDatabase = async (groupId: string) => {
  const db = useDatabase();
  await db.transaction(
    'rw',
    [
      db.posts,
      db.comments,
      db.counters,
      db.profiles,
      db.images,
      db.notifications,
      db.summary,
      db.relations,
      db.relationSummaries,
      db.pendingTrx,
      db.emptyTrx,
    ],
    async () => {
      await db.posts.where({ groupId }).delete();
      await db.comments.where({ groupId }).delete();
      await db.counters.where({ groupId }).delete();
      await db.profiles.where({ groupId }).delete();
      await db.images.where({ groupId }).delete();
      await db.notifications.where({ GroupId: groupId }).delete();
      await db.summary.where({ GroupId: groupId }).delete();
      await db.relations.where({ groupId }).delete();
      await db.relationSummaries.where({ groupId }).delete();
      await db.pendingTrx.where({ groupId }).delete();
      await db.emptyTrx.where({ groupId }).delete();
    },
  );
};

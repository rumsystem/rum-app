import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PostModel from 'hooks/useDatabase/models/posts';
import { PostType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects, store } = options;
  const { latestStatusStore, mutedListStore } = store;
  const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const activeGroupMutedPublishers = mutedListStore.mutedList
    .filter((muted) => muted.groupId === groupId)
    .map((muted) => muted.publisher);

  if (objects.length === 0) {
    return;
  }

  try {
    await database.transaction(
      'rw',
      [
        database.posts,
      ],
      async () => {
        const items = objects.map((v) => ({
          content: v,
          activity: v.Content as any as PostType,
        }));
        const posts = await PostModel.bulkGet(
          database,
          items.map((v) => ({ id: v.activity.object.id, groupId })),
          { raw: true },
        );
        const postToAdd: Array<Omit<PostModel.IDBPostRaw, 'summary'>> = [];
        for (const item of items) {
          const existedPost = posts.find((v) => v?.id === item.activity.object.id);
          if (!existedPost) {
            postToAdd.push({
              id: item.activity.object.id,
              trxId: item.content.TrxId,
              name: item.activity.object.name,
              content: item.activity.object.content,
              timestamp: item.content.TimeStamp,
              groupId,
              deleted: 0,
              history: [],
              publisher: item.content.Publisher,
              status: ContentStatus.synced,
              images: item.activity.object.images,
            });
          } else if (existedPost.status === ContentStatus.syncing && existedPost.publisher === item.content.Publisher) {
            existedPost.status = ContentStatus.synced;
            await PostModel.put(database, existedPost);
          }
        }
        const unreadCount = postToAdd.filter((v) => [
          v.timestamp > latestStatus.latestReadTimeStamp,
          !activeGroupMutedPublishers.includes(v.publisher),
        ].every((v) => !!v)).length;
        latestStatusStore.update(groupId, {
          unreadCount: latestStatus.unreadCount + unreadCount,
          latestPostTimeStamp: Math.max(latestStatus.latestPostTimeStamp, ...postToAdd.map((v) => v.timestamp)),
        });

        await PostModel.bulkAdd(database, postToAdd);
      },
    );
  } catch (e) {
    console.error(e);
  }
};

import { INoteItem } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import * as PostModel from 'hooks/useDatabase/models/posts';
import { PostDeleteType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: INoteItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, objects, store, groupId } = options;

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
          activity: v.Content as any as PostDeleteType,
        }));
        const posts = await PostModel.bulkGet(
          database,
          items.map((v) => ({ id: v.activity.object.id, groupId })),
          { raw: true },
        );
        const postToDelete: Array<PostModel.IDBPostRaw> = [];
        for (const item of items) {
          const post = posts.find((v) => v?.id === item.activity.object.id);
          if (!post) { continue; }
          if (item.content.Publisher !== post.publisher) { continue; }
          if (post.deleted) { continue; }
          post.deleted = 1;
          postToDelete.push(post);
        }
        await PostModel.bulkPut(database, postToDelete);
        store.activeGroupStore.deletePosts(postToDelete.map((v) => v.id));
      },
    );
  } catch (e) {
    console.error(e);
  }
};

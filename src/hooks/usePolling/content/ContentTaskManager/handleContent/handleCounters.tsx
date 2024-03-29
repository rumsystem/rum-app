import { parseISO } from 'date-fns';
import { utils } from 'rum-sdk-browser';
import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import * as CounterModel from 'hooks/useDatabase/models/counter';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as PendingTrxModel from 'hooks/useDatabase/models/pendingTrx';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import { CounterType } from 'utils/contentDetector';
import getHotCount from 'utils/getHotCount';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
  isPendingObjects?: boolean
}

export default async (options: IOptions) => {
  const { database, groupId, objects, store, isPendingObjects } = options;
  const { groupStore, activeGroupStore, commentStore } = store;
  const likes = objects;
  const activeGroup = groupStore.map[groupId];
  const myPublicKey = activeGroup.user_pubkey;
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  if (likes.length === 0) { return; }

  await database.transaction(
    'rw',
    [
      database.posts,
      database.comments,
      database.counters,
      database.notifications,

      database.profiles,
      database.summary,
      database.pendingTrx,
    ],
    async () => {
      const items = objects.map((v) => ({
        content: v,
        activity: v.Data as any as CounterType,
      }));

      const objectIds = items.map((v) => {
        const id = v.activity.type === 'Undo'
          ? v.activity.object.object.id
          : v.activity.object.id;
        return id;
      });
      const posts = await PostModel.bulkGet(
        database,
        objectIds.map((v) => ({ id: v, groupId })),
      );

      const comments = await CommentModel.bulkGet(
        database,
        objectIds.map((v) => ({ groupId, id: v })),
      );
      const existedCounters = await CounterModel.bulkGet(
        database,
        items.map((v) => ({
          trxId: v.content.TrxId,
          groupId,
        })),
      );

      const postsToPutMap = new Map<string, PostModel.IDBPost>();
      const commentsToPutMap = new Map<string, CommentModel.IDBComment>();
      const countersToPut: Array<CounterModel.IDBCounter> = [];
      const countersToAdd: Array<CounterModel.IDBCounter> = [];
      const notifications: Array<NotificationModel.IDBNotificationRaw> = [];
      const pendingTrxToAdd: Array<PendingTrxModel.IDBPendingTrx> = [];
      const pendingTrxToDelete: Array<Pick<PendingTrxModel.IDBPendingTrx, 'groupId' | 'trxId'>> = [];

      for (const item of items) {
        const timestamp = item.activity.published
          ? parseISO(item.activity.published).getTime()
          : Number(item.content.TimeStamp.slice(0, -6));
        const existedCounter = [...existedCounters, ...countersToAdd].find((v) => v.trxId === item.content.TrxId);

        if (existedCounter) {
          const updateExistedCounter = existedCounter.status === ContentStatus.syncing
            && existedCounter.publisher === item.content.SenderPubkey
            && existedCounter.trxId === item.content.TrxId;
          if (updateExistedCounter) {
            existedCounter.status = ContentStatus.synced;
            countersToPut.push(existedCounter);
          }
          continue;
        }

        const objectId = item.activity.type === 'Undo'
          ? item.activity.object.object.id
          : item.activity.object.id;
        const post = posts.find((v) => v.id === objectId);
        const comment = comments.find((v) => v.id === objectId);
        if (!post && !comment) {
          pendingTrxToAdd.push({
            groupId,
            trxId: item.content.TrxId,
            value: item.content,
          });
          continue;
        }

        const object = post ?? comment!;
        const objectType = post ? 'post' : 'comment';
        let counterType: CounterModel.IDBCounter['type'] = 'like';
        const updateObjectCounter = (key: 'likeCount' | 'dislikeCount', delta: number) => {
          object.summary[key] += delta;
          object.summary.hotCount = getHotCount(object.summary);
          if (item.content.SenderPubkey === myPublicKey) {
            object.extra[key] += delta;
          }
        };
        if (item.activity.type === 'Like') {
          counterType = 'like';
          updateObjectCounter('likeCount', 1);
        }
        if (item.activity.type === 'Dislike') {
          counterType = 'dislike';
          updateObjectCounter('dislikeCount', 1);
        }
        if (item.activity.type === 'Undo') {
          if (item.activity.object.type === 'Like') {
            counterType = 'undolike';
            updateObjectCounter('likeCount', -1);
          }
          if (item.activity.object.type === 'Dislike') {
            counterType = 'undodislike';
            updateObjectCounter('dislikeCount', -1);
          }
        }

        // notification (like activity only)
        const sendNotification = object.publisher === myPublicKey
          && item.content.SenderPubkey !== myPublicKey
          && item.activity.type === 'Like';
        if (sendNotification) {
          notifications.push({
            fromPublisher: item.content.SenderPubkey,
            GroupId: groupId,
            ObjectId: objectId,
            Status: NotificationModel.NotificationStatus.unread,
            TimeStamp: timestamp,
            Type: objectType === 'post'
              ? NotificationModel.NotificationType.objectLike
              : NotificationModel.NotificationType.commentLike,
          });
        }

        if (isPendingObjects) {
          pendingTrxToDelete.push({
            groupId,
            trxId: item.content.TrxId,
          });
        }

        countersToAdd.push({
          trxId: item.content.TrxId,
          groupId,
          objectId,
          objectType,
          status: ContentStatus.synced,
          type: counterType,
          publisher: item.content.SenderPubkey,
          userAddress: utils.pubkeyToAddress(item.content.SenderPubkey),
          timestamp,
        });

        if (post) { postsToPutMap.set(post.id, post); }
        if (comment) { commentsToPutMap.set(comment.id, comment); }
      }

      const postToPut = Array.from(postsToPutMap.values());
      const commentsToPut = Array.from(commentsToPutMap.values());

      await Promise.all([
        CounterModel.bulkPut(database, [...countersToAdd, ...countersToPut]),
        PostModel.bulkPut(database, postToPut),
        CommentModel.bulkPut(database, commentsToPut),
        NotificationModel.bullAdd(database, notifications),
        PendingTrxModel.bulkPut(database, pendingTrxToAdd),
        PendingTrxModel.bulkDelete(database, pendingTrxToDelete),
      ]);

      postToPut.forEach((v) => {
        if (activeGroupStore.postMap[v.id]) {
          activeGroupStore.updatePost(v.id, v);
        }
      });

      commentsToPut.forEach((v) => {
        if (commentStore.map[v.id]) {
          commentStore.updateComment(v.id, v);
        }
      });

      if (notifications.length) {
        await syncNotificationUnreadCount(groupId);
      }
    },
  );
};

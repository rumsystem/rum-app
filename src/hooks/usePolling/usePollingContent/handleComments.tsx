import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import { CommentType } from 'utils/contentDetector';
import getHotCount from 'utils/getHotCount';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}


export default async (options: IOptions) => {
  const { groupId, store, database } = options;
  const { groupStore, activeGroupStore, commentStore } = store;
  const activeGroup = groupStore.map[groupId];
  const myPublicKey = (activeGroup || {}).user_pubkey;
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  await database.transaction(
    'rw',
    [
      database.posts,
      database.comments,
      database.notifications,
      database.summary,
      database.profiles,
    ],
    async () => {
      const items = options.objects.map((v) => ({
        content: v,
        activity: v.Content as any as CommentType,
      }));
      const replyToIds = items.map((v) => v.activity.object.inreplyto.id);
      const newCommentIds = items.map((v) => v.activity.object.id);
      const comments = await CommentModel.bulkGet(
        database,
        [...replyToIds, ...newCommentIds].map((v) => ({ id: v, groupId })),
        { raw: true },
      );
      const postIds = Array.from(new Set([
        ...replyToIds,
        ...comments.map((v) => v?.postId),
      ]));
      const posts = await PostModel.bulkGet(
        database,
        postIds.map((v) => ({ id: v, groupId })),
        { raw: true },
      );
      const commentsToAdd: Array<Omit<CommentModel.IDBCommentRaw, 'summary'>> = [];
      const commentsToPutMap: Map<string, CommentModel.IDBCommentRaw> = new Map();

      for (const item of items) {
        const object = item.activity.object;
        const id = object.id;
        const existComment = comments.find((v) => v?.id === id);

        if (existComment) {
          const updateExistedComment = existComment.status === ContentStatus.syncing
            && existComment.publisher === item.content.Publisher
            && existComment.trxId === item.content.TrxId;
          if (updateExistedComment) {
            existComment.status = ContentStatus.synced;
            commentsToPutMap.set(existComment.id, existComment);
          }
          continue;
        }

        const replyTo = object.inreplyto.id;
        const post = posts.find((v) => v?.id === replyTo);
        const comment = [...comments, ...commentsToAdd].find((v) => v?.id === replyTo);
        const postId = post?.id || comment?.postId || null;
        if (!postId) { continue; }
        const threadId = comment?.threadId || comment?.id || '';
        commentsToAdd.push({
          id,
          trxId: item.content.TrxId,
          name: '',
          content: object.content,
          threadId,
          deleted: 0,
          history: [],
          groupId,
          postId,
          publisher: item.content.Publisher,
          replyTo,
          status: ContentStatus.synced,
          timestamp: item.content.TimeStamp,
          images: object.image,
        });
      }

      // update post summary
      const postNeedToUpdateIdMap = commentsToAdd.map((v) => v.postId).reduce((p, c) => {
        p.set(c, (p.get(c) ?? 0) + 1);
        return p;
      }, new Map<string, number>());
      Array.from(postNeedToUpdateIdMap.entries()).forEach(([postId, count]) => {
        const post = posts.find((u) => postId === u?.id);
        if (post) {
          post.summary.commentCount += count || 1;
          post.summary.hotCount = getHotCount(post.summary);
          const postInStore = activeGroupStore.postMap[post.id];
          if (postInStore) {
            postInStore.summary = { ...post.summary };
          }
        }
      });

      // update thread comment summary
      const threadIds = commentsToAdd.map((v) => v.threadId).filter((v) => !!v);
      const threadComments = [
        comments.filter((v) => threadIds.includes(v.id)),
        await CommentModel.bulkGet(
          database,
          threadIds
            .filter((id) => comments.every((v) => v.id !== id))
            .map((id) => ({ id, groupId })),
          { raw: true },
        ),
      ].flatMap((v) => v);
      commentsToAdd.forEach((comment) => {
        const threadComment = threadComments.find((v) => v.id === comment.threadId);
        if (threadComment) {
          threadComment.summary.commentCount += 1;
          threadComment.summary.hotCount = getHotCount(threadComment.summary);
          commentsToPutMap.set(threadComment.id, threadComment);
        }
      });
      commentsToPutMap.forEach((v) => {
        const comment = commentStore.map[v.id];
        if (comment) {
          comment.summary = { ...v.summary };
        }
      });

      // save in db
      const postsToPut = Array.from(postNeedToUpdateIdMap.keys())
        .map((v) => posts.find((u) => u?.id === v))
        .filter(<T extends unknown>(v: T | null | undefined): v is T => !!v);
      await Promise.all([
        PostModel.bulkPut(database, postsToPut),
        CommentModel.bulkAdd(database, commentsToAdd),
        CommentModel.bulkPut(database, Array.from(commentsToPutMap.values())),
      ]);

      const notifications: Array<NotificationModel.IDBNotificationRaw> = [];
      const parentCommentIds = commentsToAdd
        .flatMap((v) => [v.replyTo, v.threadId])
        .filter((v) => v);
      const parentComments = await CommentModel.bulkGet(
        database,
        parentCommentIds.map((v) => ({ groupId, id: v })),
        { raw: true },
      );
      for (const comment of commentsToAdd) {
        if (comment.publisher === myPublicKey) { continue; }
        const post = posts.find((v) => v?.id === comment.postId);
        const replyToComment = parentComments.find((v) => v.id === comment.replyTo);
        const threadComment = parentComments.find((v) => v.id === comment.threadId);
        const hasReplyNotification = replyToComment?.publisher === myPublicKey;
        if (hasReplyNotification) {
          notifications.push({
            GroupId: comment.groupId,
            ObjectId: comment.id,
            fromPublisher: comment.publisher,
            Type: NotificationModel.NotificationType.commentReply,
            Status: NotificationModel.NotificationStatus.unread,
            TimeStamp: comment.timestamp,
          });
        }
        const hasThreadNotification = replyToComment?.publisher !== myPublicKey
          && threadComment?.publisher === myPublicKey;
        if (hasThreadNotification) {
          notifications.push({
            GroupId: comment.groupId,
            ObjectId: comment.id,
            fromPublisher: comment.publisher,
            Type: NotificationModel.NotificationType.commentReply,
            Status: NotificationModel.NotificationStatus.unread,
            TimeStamp: comment.timestamp,
          });
        }
        const hasPostNotification = post
          && post.publisher === myPublicKey
          && comment.replyTo === post.id
          && comment.publisher !== myPublicKey;
        if (hasPostNotification) {
          notifications.push({
            GroupId: comment.groupId,
            ObjectId: comment.id,
            fromPublisher: comment.publisher,
            Type: NotificationModel.NotificationType.commentPost,
            Status: NotificationModel.NotificationStatus.unread,
            TimeStamp: comment.timestamp,
          });
        }
      }

      for (const notification of notifications) {
        await NotificationModel.add(database, notification);
      }
      if (notifications.length) {
        await syncNotificationUnreadCount(groupId);
      }
    },
  );
};

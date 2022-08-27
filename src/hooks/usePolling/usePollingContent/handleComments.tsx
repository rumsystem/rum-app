import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { INoteItem } from 'apis/content';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import { keyBy, isEmpty } from 'lodash';

interface IOptions {
  groupId: string
  objects: INoteItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, objects, store, database } = options;
  const db = database;
  const { groupStore, commentStore, activeGroupStore } = store;

  if (objects.length === 0) {
    return;
  }

  await database.transaction(
    'rw',
    [
      database.objects,
      database.persons,
      database.summary,
      database.comments,
      database.notifications,
      database.latestStatus,
    ],
    async () => {
      const activeGroup = groupStore.map[groupId];
      const myPublicKey = (activeGroup || {}).user_pubkey;
      const replyToTrxIds = objects.map((object) => object.Content.inreplyto?.trxid || '');
      const [dbComments, replyToObjects, replyToDbComments] = await Promise.all([
        CommentModel.bulkGet(db, objects.map((object) => object.TrxId || '')),
        ObjectModel.bulkGet(db, replyToTrxIds),
        CommentModel.bulkGet(db, replyToTrxIds),
      ]);

      const commentMap = keyBy(dbComments, (comment) => comment && comment.TrxId);
      const replyToObjectMap = keyBy(replyToObjects, (object) => object && object.TrxId);
      const replyToDbCommentMap = keyBy(replyToDbComments, (comment) => comment && comment.TrxId);

      const newCommentMap = {} as Record<string, CommentModel.IDbCommentItem>;
      const commentTrxIdsToSynced = [] as string[];

      for (const object of objects) {
        const existComment = commentMap[object.TrxId];

        if (existComment && existComment.Status !== ContentStatus.syncing) {
          continue;
        }

        if (existComment) {
          commentTrxIdsToSynced.push(object.TrxId);
          if (commentStore.trxIdsSet.has(object.TrxId)) {
            commentStore.markAsSynced(existComment.TrxId);
          }
          continue;
        }

        const Content = {
          content: object.Content.content,
          objectTrxId: '',
          replyTrxId: '',
          threadTrxId: '',
        };
        // A1
        //  -- A2
        //  -- A3 -> A2
        const inReplyToTrxId = object.Content.inreplyto?.trxid || '';
        // top comment (A1)
        const existObject = replyToObjectMap[inReplyToTrxId];
        if (existObject) {
          Content.objectTrxId = inReplyToTrxId;
        } else {
          const comment = replyToDbCommentMap[inReplyToTrxId] || newCommentMap[inReplyToTrxId];
          if (comment) {
            Content.objectTrxId = comment.Content.objectTrxId;
            // sub comment with reply (A3 -> A2)
            if (comment.Content.threadTrxId) {
              Content.threadTrxId = comment.Content.threadTrxId;
              Content.replyTrxId = comment.TrxId;
              // sub comment (A2)
            } else {
              Content.threadTrxId = comment.TrxId;
            }
          } else {
            console.error('reply comment does not exist');
            console.log(object);
            continue;
          }
        }

        newCommentMap[object.TrxId] = {
          GroupId: groupId,
          TrxId: object.TrxId,
          Publisher: object.Publisher,
          Content,
          TypeUrl: object.TypeUrl,
          TimeStamp: object.TimeStamp,
          Status: ContentStatus.synced,
        };

        if (store.activeGroupStore.id === groupId) {
          const storeObject = activeGroupStore.objectMap[Content.objectTrxId];
          if (storeObject) {
            storeObject.commentCount = (storeObject.commentCount || 0) + 1;
            activeGroupStore.updateObject(storeObject.TrxId, storeObject);
          }
        } else {
          const cachedObject = activeGroupStore.getCachedObject(groupId, Content.objectTrxId);
          if (cachedObject) {
            cachedObject.commentCount = (cachedObject.commentCount || 0) + 1;
          }
        }
      }

      const newComments = Object.values(newCommentMap);

      if (!isEmpty(newCommentMap)) {
        await CommentModel.bulkAdd(db, newComments);
      }

      if (!isEmpty(commentTrxIdsToSynced)) {
        await CommentModel.markedAsSynced(db, commentTrxIdsToSynced);
      }

      const [existObject, existComment] = await Promise.all([
        ObjectModel.checkExistForPublisher(db, {
          GroupId: groupId,
          Publisher: myPublicKey,
        }),
        CommentModel.checkExistForPublisher(db, {
          GroupId: groupId,
          Publisher: myPublicKey,
        }),
      ]);
      const shouldHandleNotification = existObject || existComment;
      if (shouldHandleNotification) {
        await tryHandleNotification(db, {
          store,
          groupId,
          comments: newComments,
          myPublicKey,
        });
      }
    },
  );
};


const tryHandleNotification = async (db: Database, options: {
  store: Store
  groupId: string
  comments: CommentModel.IDbCommentItem[]
  myPublicKey: string
}) => {
  const { store, groupId, myPublicKey } = options;
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(db, store);
  const comments = await CommentModel.bulkGet(db, options.comments.map((comment) => comment.TrxId));
  const notifications = [];

  // sub comment with reply (A3 -> A2)
  const replyComments = comments.filter((comment) => !!comment?.Content.replyTrxId);
  if (replyComments.length > 0) {
    const packedReplyComments = await CommentModel.packComments(db, replyComments);
    for (const comment of packedReplyComments) {
      if (comment.Extra.replyComment?.Publisher === myPublicKey) {
        notifications.push({
          GroupId: comment.GroupId,
          ObjectTrxId: comment.TrxId,
          fromPublisher: comment.Publisher,
          Type: NotificationModel.NotificationType.commentReply,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  // sub comment (A2)
  const subComments = comments.filter((comment) => !comment?.Content.replyTrxId && !!comment?.Content.threadTrxId);
  if (subComments.length > 0) {
    const threadComments = await CommentModel.bulkGet(db, subComments.map((comment) => comment?.Content.threadTrxId || ''));
    for (const [i, threadComment] of threadComments.entries()) {
      if (threadComment.Publisher === myPublicKey) {
        notifications.push({
          GroupId: subComments[i].GroupId,
          ObjectTrxId: subComments[i].TrxId,
          fromPublisher: subComments[i].Publisher,
          Type: NotificationModel.NotificationType.commentReply,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  // top comment (A1)
  const topComments = comments.filter((comment) => !comment?.Content.replyTrxId && !comment?.Content.threadTrxId);
  if (topComments.length > 0) {
    const packedTopComments = await CommentModel.packComments(db, topComments, {
      withObject: true,
    });

    for (const topComment of packedTopComments) {
      if (topComment?.Extra.object?.Publisher === myPublicKey && topComment.Publisher !== myPublicKey) {
        notifications.push({
          GroupId: topComment.GroupId,
          ObjectTrxId: topComment.TrxId,
          fromPublisher: topComment.Publisher,
          Type: NotificationModel.NotificationType.commentObject,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  if (notifications.length > 0) {
    for (const notification of notifications) {
      await NotificationModel.create(db, notification);
    }
    await syncNotificationUnreadCount(groupId);
  }
};

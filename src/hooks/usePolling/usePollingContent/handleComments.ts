import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { IObjectItem } from 'apis/group';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as NotificationModel from 'hooks/useDatabase/models/notification';

interface IOptions {
  groupId: string
  objects: IObjectItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, objects, store, database } = options;

  if (objects.length === 0) {
    return;
  }

  for (const object of objects) {
    try {
      const whereOptions = {
        TrxId: object.TrxId,
      };
      const existComment = await CommentModel.get(database, whereOptions);

      if (existComment && existComment.Status !== ContentStatus.syncing) {
        return;
      }

      if (existComment) {
        await CommentModel.markedAsSynced(database, whereOptions);
        if (store.commentStore.trxIdsSet.has(object.TrxId)) {
          const syncedComment = await CommentModel.get(database, whereOptions);
          console.log({ syncedComment });
          if (syncedComment) {
            store.commentStore.updateComment(
              existComment.TrxId,
              syncedComment,
            );
          }
        }
      } else {
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
        const existObject = await ObjectModel.get(database, {
          TrxId: inReplyToTrxId,
        });
        if (existObject) {
          Content.objectTrxId = inReplyToTrxId;
        } else {
          const comment = await CommentModel.get(database, {
            TrxId: inReplyToTrxId,
          });
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
            console.log(comment);
            return;
          }
        }

        await CommentModel.create(database, {
          GroupId: groupId,
          TrxId: object.TrxId,
          Publisher: object.Publisher,
          Content,
          TypeUrl: object.TypeUrl,
          TimeStamp: object.TimeStamp,
          Status: ContentStatus.synced,
        });

        const { groupStore } = store;
        const activeGroup = groupStore.map[groupId];
        const myPublicKey = (activeGroup || {}).user_pubkey;

        if (object.Publisher !== myPublicKey) {
          await tryHandleNotification(database, {
            commentTrxId: object.TrxId,
            myPublicKey,
            store,
          });
        }

        if (store.activeGroupStore.objectTrxIdSet.has(Content.objectTrxId)) {
          const latestObject = await ObjectModel.get(database, {
            TrxId: Content.objectTrxId,
          });
          if (latestObject) {
            store.activeGroupStore.updateObject(latestObject.TrxId, latestObject);
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};


const tryHandleNotification = async (database: Database, options: {
  commentTrxId: string
  myPublicKey: string
  store: Store
}) => {
  const { commentTrxId, myPublicKey, store } = options;
  const dbComment = await CommentModel.get(database, {
    TrxId: commentTrxId,
    withObject: true,
  });
  if (!dbComment) {
    return;
  }
  // sub comment with reply (A3 -> A2)
  if (dbComment?.Content.replyTrxId) {
    if (dbComment.Extra.replyComment?.Publisher === myPublicKey) {
      await NotificationModel.create(database, {
        GroupId: dbComment.GroupId,
        ObjectTrxId: dbComment.TrxId,
        Type: NotificationModel.NotificationType.commentReply,
        Status: NotificationModel.NotificationStatus.unread,
      });
    }
  // sub comment (A2)
  } else if (dbComment?.Content.threadTrxId) {
    const threadComment = await CommentModel.get(database, {
      TrxId: dbComment?.Content.threadTrxId,
    });
    if (threadComment && threadComment.Publisher === myPublicKey) {
      await NotificationModel.create(database, {
        GroupId: dbComment.GroupId,
        ObjectTrxId: dbComment.TrxId,
        Type: NotificationModel.NotificationType.commentReply,
        Status: NotificationModel.NotificationStatus.unread,
      });
    }
  // top comment (A1)
  } else if (dbComment?.Extra.object?.Publisher === myPublicKey) {
    await NotificationModel.create(database, {
      GroupId: dbComment.GroupId,
      ObjectTrxId: dbComment.TrxId,
      Type: NotificationModel.NotificationType.commentObject,
      Status: NotificationModel.NotificationStatus.unread,
    });
  }


  const unreadCountMap = await NotificationModel.getUnreadCountMap(
    database,
    {
      GroupId: dbComment.GroupId,
    },
  );
  await store.latestStatusStore.updateMap(database, dbComment.GroupId, {
    notificationUnreadCountMap: unreadCountMap,
  });
};

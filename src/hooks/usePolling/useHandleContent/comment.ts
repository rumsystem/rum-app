import React from 'react';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import {
  ContentTypeUrl,
  IObjectItem,
} from 'apis/content';
import * as ContentModel from 'hooks/useDatabase/models/content';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as globalLatestStatusModel from 'hooks/useDatabase/models/globalLatestStatus';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { groupBy, pick } from 'lodash';
import Database from 'hooks/useDatabase/database';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';

const LIMIT = 200;

const contentToComment = (content: ContentModel.IDbContentItem) => pick(content, [
  'TrxId',
  'Publisher',
  'TypeUrl',
  'TimeStamp',
  'Content',
]) as IObjectItem;

export default (duration: number) => {
  const store = useStore();
  const { commentStore, nodeStore, activeGroupStore, groupStore } = store;
  const database = useDatabase();
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(8000);
      while (!stop && !nodeStore.quitting) {
        await handle();
        await sleep(duration);
      }
    })();

    async function handle() {
      try {
        const globalLatestStatus = await globalLatestStatusModel.get(database);
        const { latestCommentId } = globalLatestStatus.Status;
        const contents = await ContentModel.list(database, {
          limit: LIMIT,
          TypeUrl: ContentTypeUrl.Object,
          startId: latestCommentId,
        });
        const comments = contents.filter((content: any) => !!content.Content.inreplyto);

        if (comments.length === 0) {
          return;
        }

        console.log({ comments, latestCommentId });

        const groupedObjects = groupBy(comments, (object: ContentModel.IDbContentItem) => object.GroupId);

        if (groupedObjects[activeGroupStore.id]) {
          await handleByGroup(activeGroupStore.id, groupedObjects[activeGroupStore.id].map(contentToComment));
          delete groupedObjects[activeGroupStore.id];
        }

        for (const groupId of Object.keys(groupedObjects)) {
          await handleByGroup(groupId, groupedObjects[groupId].map(contentToComment));
        }

        const latestContent = contents[contents.length - 1];
        await globalLatestStatusModel.createOrUpdate(database, {
          latestCommentId: latestContent.Id,
        });
      } catch (err) {
        console.log(err);
      }
    }

    async function handleByGroup(groupId: string, objects: IObjectItem[]) {
      for (const object of objects) {
        const whereOptions = {
          TrxId: object.TrxId,
          withExtra: true,
        };
        const existComment = await CommentModel.get(database, whereOptions);

        if (existComment && existComment.Status !== ContentStatus.syncing) {
          continue;
        }

        if (existComment) {
          await CommentModel.markedAsSynced(database, whereOptions);
          if (commentStore.trxIdsSet.has(object.TrxId)) {
            const syncedComment = {
              ...existComment,
              Status: ContentStatus.synced,
            };
            commentStore.updateComment(
              existComment.TrxId,
              syncedComment,
            );
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
              console.log(object);
              continue;
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

          const activeGroup = groupStore.map[groupId];
          const myPublicKey = (activeGroup || {}).user_pubkey;

          if (object.Publisher !== myPublicKey) {
            await tryHandleNotification(database, {
              commentTrxId: object.TrxId,
              myPublicKey,
            });
          }

          const storeObject = activeGroupStore.objectMap[Content.objectTrxId];
          if (storeObject) {
            storeObject.Extra.commentCount += 1;
            activeGroupStore.updateObject(storeObject.TrxId, storeObject);
          }
        }
      }
      await syncNotificationUnreadCount(groupId);
    }

    return () => {
      stop = true;
    };
  }, []);
};

const tryHandleNotification = async (database: Database, options: {
  commentTrxId: string
  myPublicKey: string
}) => {
  const { commentTrxId, myPublicKey } = options;
  const dbComment = await CommentModel.get(database, {
    TrxId: commentTrxId,
    withObject: true,
    withExtra: true,
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
};

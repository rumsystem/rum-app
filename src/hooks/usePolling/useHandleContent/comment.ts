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
import { groupBy, pick, keyBy, isEmpty } from 'lodash';
import Database from 'hooks/useDatabase/database';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';

const LIMIT = 200;

const debugSkip = true;

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
    let prevLatestObjectId = 0;

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
        const { latestObjectId, latestCommentId } = globalLatestStatus.Status;
        // if (latestCommentId > 400) {
        //   return;
        // }
        if (prevLatestObjectId === 0) {
          console.log(' ------------- 【comments】object 还没开始，我先等等 ---------------');
          prevLatestObjectId = latestObjectId;
        }
        if (latestCommentId > latestObjectId) {
          console.log(' ------------- 【comments】我比 object 还快了，我休息一会 ---------------');
          return;
        }
        if (latestObjectId - prevLatestObjectId > 100) {
          console.log(' ------------- 【comments】object 很忙，我等个 8 秒 ---------------');
          await sleep(8000);
        }
        console.log({ latestObjectId, prevLatestObjectId });
        prevLatestObjectId = latestObjectId;
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

        console.log(` ------------- 【comments】本次要处理的数据量：${comments.length} ---------------`);

        const t1 = new Date().getTime();

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

        const t2 = new Date().getTime();

        console.log(` ------------- 【comments】本次处理消耗的时间：${t2 - t1} ms ---------------`);
      } catch (err) {
        console.log(err);
      }
    }

    async function handleByGroup(groupId: string, objects: IObjectItem[]) {
      await database.transaction(
        'rw',
        [
          database.objects,
          database.persons,
          database.summary,
          database.comments,
          database.notifications,
          database.latestStatus,
          database.globalLatestStatus,
        ],
        async () => {
          const replyToTrxIds = objects.map((object) => object.Content.inreplyto?.trxid || '');
          const [dbComments, replyToObjects, replyToDbComments] = await Promise.all([
            CommentModel.bulkGet(database, objects.map((object) => object.TrxId || '')),
            ObjectModel.bulkGet(database, replyToTrxIds),
            CommentModel.bulkGet(database, replyToTrxIds),
          ]);
          const replyToComments = objects.filter((object) => replyToTrxIds.includes(object.TrxId));

          const commentMap = keyBy(dbComments, (comment) => comment && comment.TrxId);
          const replyToObjectMap = keyBy(replyToObjects, (object) => object && object.TrxId);
          const replyToDbCommentMap = keyBy(replyToDbComments, (comment) => comment && comment.TrxId);
          const replyToCommentMap = keyBy(replyToComments, (comment) => comment && comment.TrxId);

          const newCommentMap = {} as Record<string, CommentModel.IDbCommentItem>;
          const commentTrxIdsToSynced = [] as string[];

          console.log({ objects, replyToObjects, dbComments, replyToComments });

          console.log({ commentMap, replyToObjectMap, replyToDbComments, replyToCommentMap });

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

            const activeGroup = groupStore.map[groupId];
            const myPublicKey = (activeGroup || {}).user_pubkey;

            if (!debugSkip) {
              if (object.Publisher !== myPublicKey) {
                await tryHandleNotification(database, {
                  commentTrxId: object.TrxId,
                  myPublicKey,
                });
              }
            }

            const storeObject = activeGroupStore.objectMap[Content.objectTrxId];
            if (storeObject) {
              storeObject.Extra.commentCount += 1;
              activeGroupStore.updateObject(storeObject.TrxId, storeObject);
            }
          }

          console.log({ newCommentMap, commentTrxIdsToSynced });

          if (!isEmpty(newCommentMap)) {
            await CommentModel.bulkAdd(database, Object.values(newCommentMap));
          }

          if (!isEmpty(commentTrxIdsToSynced)) {
            await CommentModel.markedAsSynced(database, commentTrxIdsToSynced);
          }

          if (!debugSkip) {
            await syncNotificationUnreadCount(groupId);
          }
        },
      );
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

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
import { useStore, Store } from 'store';
import useDatabase from 'hooks/useDatabase';
import { groupBy, pick, keyBy, isEmpty } from 'lodash';
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
  const db = useDatabase();

  React.useEffect(() => {
    let stop = false;
    let prevLatestObjectId = 0;
    let firstFullLoaded = false;

    (async () => {
      console.log(' ------------- hard code: sleep(8000) ---------------');
      await sleep(2000);
      while (!stop && !nodeStore.quitting) {
        await handle();
        await sleep(duration);
      }
    })();

    async function handle() {
      try {
        const globalLatestStatus = await globalLatestStatusModel.get(db);
        const { latestObjectId, latestCommentId } = globalLatestStatus.Status;
        if (prevLatestObjectId === 0) {
          prevLatestObjectId = latestObjectId;
        }
        if (latestCommentId >= latestObjectId) {
          if (latestCommentId > 0) {
            firstFullLoaded = true;
          }
          return;
        }
        if (latestObjectId - prevLatestObjectId > 100) {
          console.log(' ------------- 【comments】object 很忙，我等个 8 秒 ---------------');
          await sleep(8000);
        }
        console.log({ latestObjectId, prevLatestObjectId });
        prevLatestObjectId = latestObjectId;
        const contents = await ContentModel.list(db, {
          limit: LIMIT,
          TypeUrl: ContentTypeUrl.Object,
          startId: latestCommentId,
        });
        const comments = contents.filter((content: any) => !!content.Content.inreplyto);

        if (comments.length === 0) {
          if (latestCommentId > 0) {
            firstFullLoaded = true;
          }
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
        await globalLatestStatusModel.createOrUpdate(db, {
          latestCommentId: latestContent.Id,
        });

        const t2 = new Date().getTime();

        console.log(` ------------- 【comments】本次处理消耗的时间：${t2 - t1} ms ---------------`);
      } catch (err) {
        console.log(err);
      }
    }

    async function handleByGroup(groupId: string, objects: IObjectItem[]) {
      await db.transaction(
        'rw',
        [
          db.contents,
          db.objects,
          db.persons,
          db.summary,
          db.comments,
          db.notifications,
          db.latestStatus,
          db.globalLatestStatus,
        ],
        async () => {
          const activeGroup = groupStore.map[groupId];
          const myPublicKey = (activeGroup || {}).user_pubkey;

          const existObjectOrComment = await ContentModel.get(db, {
            GroupId: groupId,
            Publisher: myPublicKey,
            TypeUrl: ContentTypeUrl.Object,
          });

          const shouldHandleNotification = firstFullLoaded && !!existObjectOrComment;

          console.log({ existObjectOrComment, shouldHandleNotification, firstFullLoaded });

          const replyToTrxIds = objects.map((object) => object.Content.inreplyto?.trxid || '');
          const [dbComments, replyToObjects, replyToDbComments] = await Promise.all([
            CommentModel.bulkGet(db, objects.map((object) => object.TrxId || '')),
            ObjectModel.bulkGet(db, replyToTrxIds),
            CommentModel.bulkGet(db, replyToTrxIds),
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

            const storeObject = activeGroupStore.objectMap[Content.objectTrxId];
            if (storeObject) {
              storeObject.commentCount = (storeObject.commentCount || 0) + 1;
              activeGroupStore.updateObject(storeObject.TrxId, storeObject);
            }
          }

          const newComments = Object.values(newCommentMap);

          console.log({ newCommentMap, commentTrxIdsToSynced });

          if (!isEmpty(newCommentMap)) {
            await CommentModel.bulkAdd(db, newComments);
          }

          if (!isEmpty(commentTrxIdsToSynced)) {
            await CommentModel.markedAsSynced(db, commentTrxIdsToSynced);
          }

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
    }

    return () => {
      stop = true;
    };
  }, []);
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

  // console.log(' ------------- tryHandleNotification ---------------');
  // console.log({ comments });

  // sub comment with reply (A3 -> A2)
  const replyComments = comments.filter((comment) => !!comment?.Content.replyTrxId);
  if (replyComments.length > 0) {
    // console.log(' ------------- catch ---------------');
    // console.log({ replyComments });
    const packedReplyComments = await CommentModel.packComments(db, replyComments);
    for (const comment of packedReplyComments) {
      if (comment.Extra.replyComment?.Publisher === myPublicKey) {
        notifications.push({
          GroupId: comment.GroupId,
          ObjectTrxId: comment.TrxId,
          Type: NotificationModel.NotificationType.commentReply,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  // sub comment (A2)
  const subComments = comments.filter((comment) => !comment?.Content.replyTrxId && !!comment?.Content.threadTrxId);
  if (subComments.length > 0) {
    // console.log(' ------------- catch ---------------');
    // console.log({ subComments });
    const threadComments = await CommentModel.bulkGet(db, subComments.map((comment) => comment?.Content.threadTrxId || ''));
    console.log({ threadComments });
    for (const threadComment of threadComments) {
      if (threadComment.Publisher === myPublicKey) {
        notifications.push({
          GroupId: threadComment.GroupId,
          ObjectTrxId: threadComment.TrxId,
          Type: NotificationModel.NotificationType.commentReply,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  // top comment (A1)
  const topComments = comments.filter((comment) => !comment?.Content.replyTrxId && !comment?.Content.threadTrxId);
  if (topComments.length > 0) {
    // console.log(' ------------- catch ---------------');
    // console.log({ topComments });
    const packedTopComments = await CommentModel.packComments(db, topComments, {
      withObject: true,
    });
    console.log({ packedTopComments });
    for (const topComment of packedTopComments) {
      if (topComment?.Extra.object?.Publisher === myPublicKey) {
        notifications.push({
          GroupId: topComment.GroupId,
          ObjectTrxId: topComment.TrxId,
          Type: NotificationModel.NotificationType.commentObject,
          Status: NotificationModel.NotificationStatus.unread,
        });
      }
    }
  }

  // console.log({ notifications });

  if (notifications.length > 0) {
    for (const notification of notifications) {
      await NotificationModel.create(db, notification);
    }
    await syncNotificationUnreadCount(groupId);
  }
};

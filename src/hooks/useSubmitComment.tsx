import React from 'react';
import { useStore } from 'store';
import { ContentTypeUrl, IComment } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import { v4 as uuidv4 } from 'uuid';
import { sleep } from 'utils';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as NotificationModel from 'hooks/useDatabase/models/notification';

export default () => {
  const { activeGroupStore, nodeStore, commentStore } = useStore();
  const database = useDatabase();

  return React.useCallback(
    async (
      _data: IComment,
      options: {
        afterCreated?: () => unknown | Promise<unknown>
      } = {},
    ) => {
      const data = {
        replyTrxId: '',
        threadTrxId: '',
        ..._data,
      };
      const payload = {
        type: 'Add',
        comment: data,
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      // const res = await GroupApi.postContent(payload);
      const res = {
        trx_id: uuidv4(),
      };
      const comment = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_publickey,
        Content: payload.comment,
        TypeUrl: ContentTypeUrl.Comment,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.syncing,
      };
      await sleep(300);
      await CommentModel.create(database, comment);
      const dbComment = await CommentModel.get(database, {
        TrxId: comment.TrxId,
        currentPublisher: nodeStore.info.node_publickey,
      });
      if (options.afterCreated) {
        await options.afterCreated();
      }
      if (dbComment) {
        const object = await ObjectModel.get(database, {
          TrxId: dbComment.Content.objectTrxId,
          currentPublisher: nodeStore.info.node_publickey,
        });
        if (object) {
          activeGroupStore.updateObject(object.TrxId, object);
          if (object.Publisher === nodeStore.info.node_publickey) {
            await NotificationModel.create(database, {
              GroupId: comment.GroupId,
              ObjectTrxId: comment.TrxId,
              Type: comment.Content.replyTrxId
                ? NotificationModel.NotificationType.commentReply
                : NotificationModel.NotificationType.commentObject,
              Status: NotificationModel.NotificationStatus.unread,
            });
          }
        }
        commentStore.addComment(dbComment);
      }
      await sleep(80);
      return comment;
    },
    [],
  );
};

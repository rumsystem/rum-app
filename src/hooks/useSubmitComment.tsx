import React from 'react';
import { useStore } from 'store';
import GroupApi, { ContentTypeUrl } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import sleep from 'utils/sleep';
import * as ObjectModel from 'hooks/useDatabase/models/object';

export default () => {
  const { activeGroupStore, nodeStore, commentStore } = useStore();
  const database = useDatabase();

  return React.useCallback(
    async (
      data: CommentModel.IComment,
      options: {
        afterCreated?: () => unknown | Promise<unknown>
        head?: boolean
      } = {},
    ) => {
      const payload = {
        type: 'Add',
        object: {
          type: 'Note',
          content: data.content,
          inreplyto: {
            trxid: (data.replyTrxId || '') || (data.threadTrxId || '') || data.objectTrxId,
          },
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.postContent(payload);
      const comment = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_publickey,
        Content: data,
        TypeUrl: ContentTypeUrl.Object,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.syncing,
      };
      await sleep(300);
      await CommentModel.create(database, comment);
      const dbComment = await CommentModel.get(database, {
        TrxId: comment.TrxId,
      });
      if (options.afterCreated) {
        await options.afterCreated();
      }
      if (dbComment) {
        const object = await ObjectModel.get(database, {
          TrxId: dbComment.Content.objectTrxId,
        });
        if (object) {
          activeGroupStore.updateObject(object.TrxId, object);
        }
        commentStore.addComment(dbComment, options.head);
      }
      await sleep(80);
      return comment;
    },
    [],
  );
};

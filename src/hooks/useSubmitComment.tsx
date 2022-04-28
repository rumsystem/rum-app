import React from 'react';
import { useStore } from 'store';
import ContentApi, { ContentTypeUrl, INotePayload } from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import sleep from 'utils/sleep';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { runInAction } from 'mobx';
import useCanIPost from 'hooks/useCanIPost';

export default () => {
  const { activeGroupStore, commentStore, groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  return React.useCallback(
    async (
      data: CommentModel.IComment,
      options: {
        afterCreated?: () => Promise<unknown>
        head?: boolean
      } = {},
    ) => {
      const groupId = groupStore.getGroupIdOfResource(activeGroupStore.id, 'comments');
      const activeGroup = groupStore.map[groupId];

      await canIPost(groupId);

      const payload: INotePayload = {
        type: 'Add',
        object: {
          type: 'Note',
          content: data.content,
          inreplyto: {
            trxid: (data.replyTrxId || '') || (data.threadTrxId || '') || data.objectTrxId,
          },
        },
        target: {
          id: groupId,
          type: 'Group',
        },
      };
      if (data.image) {
        payload.object.image = data.image;
      }
      const res = await ContentApi.postNote(payload);
      const comment = {
        GroupId: groupId,
        TrxId: res.trx_id,
        Publisher: activeGroup.user_pubkey,
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
          currentPublisher: dbComment.Publisher,
        });
        runInAction(() => {
          if (object) {
            activeGroupStore.updateObject(object.TrxId, object);
          }
          commentStore.addComment(dbComment, options.head);
        });
      }
      await sleep(80);
      return comment;
    },
    [],
  );
};

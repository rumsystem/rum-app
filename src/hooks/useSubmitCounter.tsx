import React from 'react';
import { useStore } from 'store';
import ContentApi from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as CounterModel from 'hooks/useDatabase/models/counter';
import sleep from 'utils/sleep';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import { lang } from 'utils/lang';
import useCanIPost from 'hooks/useCanIPost';
import { NonUndoCounterType, UndoCounterType } from 'utils/contentDetector';
import getHotCount from 'utils/getHotCount';

export interface CounterParams {
  type: CounterModel.IDBCounter['type']
  objectId: string
}

export default () => {
  const { activeGroupStore, commentStore, snackbarStore, groupStore } = useStore();
  const database = useDatabase();
  const pendingRef = React.useRef(false);
  const canIPost = useCanIPost();

  return React.useCallback(async (data: CounterParams) => {
    if (pendingRef.current) {
      return;
    }

    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];

    await canIPost(groupId);

    pendingRef.current = true;
    try {
      const isUndoActivity = data.type === 'undodislike' || data.type === 'undolike';
      const payload: UndoCounterType | NonUndoCounterType = isUndoActivity
        ? {
          type: 'Undo',
          object: {
            type: data.type === 'undolike' ? 'Like' : 'Dislike',
            object: {
              type: 'Note',
              id: data.objectId,
            },
          },
        }
        : {
          type: data.type === 'like' ? 'Like' : 'Dislike',
          object: {
            type: 'Note',
            id: data.objectId,
          },
        };

      const post = await PostModel.get(database, {
        groupId,
        id: data.objectId,
        currentPublisher: activeGroup.user_pubkey,
      });
      const comment = await CommentModel.get(database, {
        groupId,
        id: data.objectId,
        currentPublisher: activeGroup.user_pubkey,
      });
      const res = await ContentApi.postNote(payload, groupId);
      if (!post && !comment) { return; }

      const objectType = post ? 'post' : 'comment';
      const object = post || comment;

      if (object) {
        if (data.type === 'like') { object.summary.likeCount += 1; object.extra.likeCount += 1; }
        if (data.type === 'dislike') { object.summary.dislikeCount += 1; object.extra.dislikeCount += 1; }
        if (data.type === 'undolike') { object.summary.likeCount -= 1; object.extra.likeCount -= 1; }
        if (data.type === 'undodislike') { object.summary.dislikeCount -= 1; object.extra.dislikeCount -= 1; }
      }

      await Promise.all([
        CounterModel.add(database, {
          trxId: res.trx_id,
          groupId,
          type: data.type,
          objectId: data.objectId,
          objectType,
          publisher: activeGroup.user_pubkey,
          timestamp: Date.now() * 1000000,
          status: ContentStatus.syncing,
        }),
      ]);

      if (objectType === 'post' && post) {
        post.summary.hotCount = getHotCount(post.summary);
        await PostModel.put(database, post);
        if (activeGroupStore.postMap[post.id]) {
          activeGroupStore.updatePost(post.id, post);
        }
      }

      if (objectType === 'comment' && comment) {
        comment.summary.hotCount = getHotCount(comment.summary);
        await CommentModel.put(database, comment);
        if (commentStore.map[comment.id]) {
          commentStore.updateComment(comment.id, comment);
        }
      }
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    await sleep(2000);
    pendingRef.current = false;
  }, []);
};

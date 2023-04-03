import React from 'react';
import { useStore } from 'store';
import ContentApi from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as PostModel from 'hooks/useDatabase/models/posts';
import sleep from 'utils/sleep';
import { runInAction } from 'mobx';
import useCanIPost from 'hooks/useCanIPost';
import { CommentType } from 'utils/contentDetector';
import { v4 } from 'uuid';
import getHotCount from 'utils/getHotCount';

export interface ISubmitCommentPayload {
  postId: string
  replyTo?: string
  threadId?: string
  content: string
  image?: Array<{
    mediaType: string
    name: string
    content: string
  }>
}

export default () => {
  const { activeGroupStore, commentStore, groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  return React.useCallback(
    async (
      data: ISubmitCommentPayload,
      options: {
        afterCreated?: () => Promise<unknown>
        head?: boolean
      } = {},
    ) => {
      const groupId = activeGroupStore.id;
      const activeGroup = groupStore.map[groupId];

      await canIPost(groupId);

      const images = data.image
        ? data.image.map((v) => ({ content: v.content, mediaType: v.mediaType, type: 'Image' } as const))
        : [];

      const payload: CommentType = {
        type: 'Create',
        object: {
          id: v4(),
          type: 'Note',
          content: data.content,
          inreplyto: {
            type: 'Note',
            id: data.replyTo ?? data.postId,
          },
          ...images.length ? { image: images } : {},
        },
      };
      const object = payload.object;

      const res = await ContentApi.postNote(payload, groupId);
      await sleep(300);
      await CommentModel.add(database, {
        id: object.id,
        content: object.content,
        groupId,
        name: '',
        deleted: 0,
        history: [],
        postId: data.postId,
        threadId: data.threadId ?? '',
        replyTo: object.inreplyto.id,
        publisher: activeGroup.user_pubkey,
        status: ContentStatus.syncing,
        timestamp: Date.now() * 1000000,
        trxId: res.trx_id,
        images,
      });

      if (options.afterCreated) {
        await options.afterCreated();
      }

      if (data.postId) {
        const post = activeGroupStore.postMap[data.postId] ?? await PostModel.get(
          database,
          { groupId, id: data.postId },
        );
        if (post) {
          runInAction(() => {
            post.summary.commentCount += 1;
            post.summary.hotCount = getHotCount(post.summary);
            if (activeGroupStore.postMap[post.id]) {
              activeGroupStore.updatePost(post.id, post);
            }
          });
          await PostModel.put(database, JSON.parse(JSON.stringify(post)));
        }
      }

      if (data.threadId) {
        const threadComment = commentStore.map[data.threadId] ?? CommentModel.get(
          database,
          { groupId, id: data.threadId },
        );
        if (threadComment) {
          runInAction(() => {
            threadComment.summary.commentCount += 1;
            threadComment.summary.hotCount = getHotCount(threadComment.summary);
            if (commentStore.map[threadComment.id]) {
              commentStore.updateComment(threadComment.id, threadComment);
            }
          });
          await CommentModel.put(database, JSON.parse(JSON.stringify(threadComment)));
        }
      }

      const dbComment = (await CommentModel.get(database, { groupId, id: object.id }))!;
      commentStore.addComment(dbComment, options.head);
      await sleep(80);
      return dbComment;
    },
    [],
  );
};

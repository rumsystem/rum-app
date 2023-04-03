import React from 'react';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import useCanIPost from 'hooks/useCanIPost';
import ContentApi from 'apis/content';
import * as PostModel from 'hooks/useDatabase/models/posts';
import useDatabase from './useDatabase';

export default () => {
  const { snackbarStore, confirmDialogStore, activeGroupStore, groupStore } = useStore();
  const canIPost = useCanIPost();
  const database = useDatabase();

  const deletePost = async (postId: string) => {
    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];
    await canIPost(groupId);
    const post = await PostModel.get(database, { groupId, id: postId });
    if (!post || post.deleted || activeGroup.user_pubkey !== post.publisher) { return; }

    const payload = {
      group_id: groupId,
      data: {
        type: 'Delete',
        object: {
          type: 'Note',
          id: postId,
        },
      },
    };
    const res = await ContentApi.postNote(payload, groupId);
    post.history.unshift({
      trxId: res.trx_id,
      timestamp: Date.now() * 1000000,
      acvitity: payload.data,
    });
    post.deleted = 1;
    await sleep(800);

    await PostModel.put(database, post);
    activeGroupStore.deletePost(post.id);
  };

  return React.useCallback((postId: string) => {
    confirmDialogStore.show({
      content: lang.confirmToDeletePost,
      okText: lang.yes,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        try {
          await deletePost(postId);
          confirmDialogStore.hide();
          await sleep(300);
          snackbarStore.show({
            message: lang.deleted,
          });
        } catch (_) {}
        confirmDialogStore.setLoading(false);
      },
    });
  }, []);
};

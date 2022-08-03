import React from 'react';
import { useStore } from 'store';
import ContentApi, { ContentTypeUrl, ILikePayload } from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as LikeModel from 'hooks/useDatabase/models/like';
import sleep from 'utils/sleep';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import useGroupStatusCheck from './useGroupStatusCheck';

export default () => {
  const { activeGroupStore, commentStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const pendingRef = React.useRef(false);
  const groupStatusCheck = useGroupStatusCheck();

  return React.useCallback(async (data: LikeModel.ILike) => {
    if (pendingRef.current) {
      return;
    }
    const canDoIt = groupStatusCheck(activeGroupStore.id);
    if (!canDoIt) {
      return;
    }
    pendingRef.current = true;
    try {
      const payload: ILikePayload = {
        type: data.type,
        object: {
          id: data.objectTrxId,
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await ContentApi.like(payload);
      const like = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: activeGroup.user_pubkey,
        Content: data,
        TypeUrl: ContentTypeUrl.Object,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.syncing,
      };
      await LikeModel.create(database, like);
      const object = await ObjectModel.get(database, {
        TrxId: like.Content.objectTrxId,
        currentPublisher: activeGroup.user_pubkey,
      });
      if (object) {
        activeGroupStore.updateObject(object.TrxId, object);
      } else {
        const comment = await CommentModel.get(database, {
          TrxId: like.Content.objectTrxId,
          currentPublisher: activeGroup.user_pubkey,
        });
        if (comment) {
          commentStore.updateComment(comment.TrxId, comment);
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

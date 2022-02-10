import React from 'react';
import { useStore } from 'store';
import { ContentTypeUrl, IVote, IVoteObjectType } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as VoteModel from 'hooks/useDatabase/models/vote';
import { v4 as uuidv4 } from 'uuid';
import sleep from 'utils/sleep';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

export default () => {
  const { activeGroupStore, commentStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();

  return React.useCallback(async (data: IVote) => {
    try {
      const payload = {
        type: 'Add',
        vote: data,
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      // const res = await GroupApi.postContent(payload);
      const res = {
        trx_id: uuidv4(),
      };
      const vote = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: activeGroup.user_pubkey,
        Content: payload.vote,
        TypeUrl: ContentTypeUrl.Vote,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.syncing,
      };
      await sleep(300);
      await VoteModel.create(database, vote);
      if (vote.Content.objectType === IVoteObjectType.object) {
        const object = await ObjectModel.get(database, {
          TrxId: vote.Content.objectTrxId,
        });
        if (object) {
          activeGroupStore.updateObject(object.TrxId, object);
          if (object.Publisher === activeGroup.user_pubkey) {
            await NotificationModel.create(database, {
              GroupId: object.GroupId,
              ObjectTrxId: object.TrxId,
              Type: NotificationModel.NotificationType.objectLike,
              Status: NotificationModel.NotificationStatus.unread,
            });
          }
        }
      } else if (vote.Content.objectType === IVoteObjectType.comment) {
        const comment = await CommentModel.get(database, {
          TrxId: vote.Content.objectTrxId,
        });
        if (comment) {
          commentStore.updateComment(comment.TrxId, comment);
          if (comment.Publisher === activeGroup.user_pubkey) {
            await NotificationModel.create(database, {
              GroupId: comment.GroupId,
              ObjectTrxId: comment.TrxId,
              Type: NotificationModel.NotificationType.commentLike,
              Status: NotificationModel.NotificationStatus.unread,
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  }, []);
};

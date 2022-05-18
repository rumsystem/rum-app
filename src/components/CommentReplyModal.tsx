import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import CommentItem from 'layouts/Main/Timeline/Comment/CommentItem';
import { useStore } from 'store';
import Editor from 'components/Editor';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useDatabase from 'hooks/useDatabase';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import useActiveGroup from 'store/selectors/useActiveGroup';

const Reply = observer(() => {
  const { activeGroupStore, modalStore, commentStore } = useStore();
  const { commentTrxId } = modalStore.commentReply.data;
  const state = useLocalObservable(() => ({
    isFetched: false,
    comment: null as CommentModel.IDbDerivedCommentItem | null,
    drawerReplyValue: '',
    replyingComment: null,
    isCreatingComment: false,
    isCreatedComment: false,
    openDrawer: false,
    loading: false,
  }));
  const database = useDatabase();
  const submitComment = useSubmitComment();
  const selectComment = useSelectComment();
  const activeGroup = useActiveGroup();

  React.useEffect(() => {
    (async () => {
      try {
        const comment = await CommentModel.get(database, {
          TrxId: commentTrxId,
          withObject: true,
          currentPublisher: activeGroup.user_pubkey,
        });
        if (comment) {
          commentStore.addCommentToMap(commentTrxId, comment);
        }
      } catch (err) {
        console.error(err);
      }
      state.isFetched = true;
    })();
  }, []);

  if (!state.isFetched) {
    return null;
  }

  const comment = commentStore.map[commentTrxId];

  const submit = async (data: ISubmitObjectPayload) => {
    if (!comment) {
      return;
    }
    const newComment = await submitComment(
      {
        ...data,
        objectTrxId: comment.Content.objectTrxId,
        replyTrxId: comment.TrxId,
        threadTrxId: comment.Content.threadTrxId || comment.TrxId,
      },
      {
        afterCreated: async () => {
          await sleep(400);
          modalStore.commentReply.hide();
        },
      },
    );
    if (!newComment) {
      return;
    }
    modalStore.commentReply.hide();
    selectComment(newComment.TrxId, {
      inObjectDetailModal: modalStore.objectDetail.open,
    });
  };

  return (
    <div className="bg-white rounded-0 py-5 pl-6 pr-8 max-h-[95vh] overflow-y-auto">
      <div className="w-[535px]">
        {comment && (
          <div>
            <CommentItem
              comment={comment}
              object={
                comment.Extra.object!
              }
              disabledReply
              isTopComment
            />
            <div className="mt-3">
              <Editor
                editorKey={`comment_reply_${commentTrxId}`}
                profile={activeGroupStore.profile}
                minRows={3}
                placeholder={`${lang.reply} ${comment.Extra.user.profile.name}`}
                autoFocus
                submit={submit}
                smallSize
                buttonClassName="scale-90"
                enabledImage
                imageLimit={1}
                imagesClassName='ml-12'
              />
            </div>
          </div>
        )}
        {!comment && (
          <div className="py-32 text-center text-14 text-gray-400 opacity-80">
            {lang.notFound(lang.comment)}
          </div>
        )}
      </div>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  return (
    <Dialog
      hideCloseButton
      open={modalStore.commentReply.open}
      onClose={() => modalStore.commentReply.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Reply />
    </Dialog>
  );
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Comments from './Comments';
import { useStore } from 'store';
import Editor from 'components/Editor';
import useDatabase from 'hooks/useDatabase';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import useActiveGroup from 'store/selectors/useActiveGroup';
import sleep from 'utils/sleep';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { lang } from 'utils/lang';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
}

export default observer((props: IProps) => {
  const { commentStore, activeGroupStore, modalStore } = useStore();
  const activeGroup = useActiveGroup();
  const { object } = props;
  const { commentsGroupMap } = commentStore;
  const comments = commentsGroupMap[object.TrxId] || [];
  const state = useLocalObservable(() => ({
    loading: false,
  }));
  const database = useDatabase();
  const submitComment = useSubmitComment();
  const selectComment = useSelectComment();

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      await sleep(400);
      const comments = await CommentModel.list(database, {
        personGroupId: activeGroupStore.id,
        objectTrxId: object.TrxId,
        currentPublisher: activeGroup.user_pubkey,
        limit: 999,
      });
      commentStore.addComments(comments);
      state.loading = false;
      const { selectedCommentOptions } = modalStore.objectDetail.data;
      if (
        props.inObjectDetailModal
        && selectedCommentOptions
        && comments.length > 0
      ) {
        await sleep(10);
        selectComment(selectedCommentOptions.comment.TrxId, {
          scrollBlock: selectedCommentOptions.scrollBlock,
          disabledHighlight: selectedCommentOptions.disabledHighlight,
          inObjectDetailModal: true,
        });
      }
    })();
  }, []);

  const submit = React.useCallback(async (data: ISubmitObjectPayload) => {
    try {
      const comment = await submitComment({
        ...data,
        objectTrxId: object.TrxId,
      });
      if (comment) {
        selectComment(comment.TrxId, {
          inObjectDetailModal: props.inObjectDetailModal,
        });
      }
      return true;
    } catch (_) {
      return false;
    }
  }, []);

  if (state.loading) {
    return (
      <Fade in={true} timeout={300}>
        <div className={props.inObjectDetailModal ? 'py-8' : 'py-2'}>
          <Loading />
        </div>
      </Fade>
    );
  }

  return (
    <div className="comment" id="comment-section" data-test-id="timeline-comment-item">
      <div className="mt-[14px]" data-test-id="timeline-comment-editor">
        <Editor
          editorKey={`comment_${object.TrxId}`}
          profile={activeGroupStore.profile}
          minRows={
            modalStore.objectDetail.open && comments.length === 0 ? 3 : 1
          }
          placeholder={lang.publishYourComment}
          submit={submit}
          autoFocusDisabled
          smallSize
          buttonClassName="transform scale-90"
          hideButtonDefault
          buttonBorder={() =>
            comments.length > 0 && <div className="border-t border-gray-f2 mt-3" />}
          enabledImage
          imagesClassName='ml-12'
        />
      </div>
      {comments.length > 0 && (
        <div id="comments" className="mt-4">
          <Comments
            comments={comments}
            object={object}
            inObjectDetailModal={props.inObjectDetailModal}
          />
        </div>
      )}
    </div>
  );
});

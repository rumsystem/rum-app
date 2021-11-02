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
import sleep from 'utils/sleep';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
}

export default observer((props: IProps) => {
  const { commentStore, activeGroupStore, modalStore, nodeStore } = useStore();
  const { commentsGroupMap } = commentStore;
  const { object } = props;
  const isMyObject = object.Publisher === nodeStore.info.node_publickey;
  const comments = commentsGroupMap[object.TrxId] || [];
  const draftKey = `COMMENT_DRAFT_${object.TrxId}`;
  const state = useLocalObservable(() => ({
    value: localStorage.getItem(draftKey) || '',
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
        GroupId: activeGroupStore.id,
        objectTrxId: object.TrxId,
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

  const handleEditorChange = (content: string) => {
    localStorage.setItem(draftKey, content);
  };

  const submit = async (content: string) => {
    const comment = await submitComment({
      content,
      objectTrxId: object.TrxId,
    });
    localStorage.removeItem(draftKey);
    selectComment(comment.TrxId, {
      inObjectDetailModal: props.inObjectDetailModal,
    });
  };

  const renderMain = () => {
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
      <div className="comment" id="comment-section">
        <div className="mt-[14px]">
          <Editor
            profile={activeGroupStore.profile}
            value={state.value}
            autoFocus={!isMyObject && comments.length === 0}
            minRows={
              modalStore.objectDetail.open && comments.length === 0 ? 3 : 1
            }
            placeholder="发布你的评论 ..."
            submit={submit}
            saveDraft={handleEditorChange}
            smallSize
            buttonClassName="transform scale-90"
            hideButtonDefault
            buttonBorder={() =>
              comments.length > 0 && <div className="border-t border-gray-f2 mt-3" />}
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
  };

  return renderMain();
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Comments from './Comments';
import { useStore } from 'store';
import Editor from 'components/PostEditor';
import useDatabase from 'hooks/useDatabase';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import sleep from 'utils/sleep';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { assetsBasePath } from 'utils/env';
import classNames from 'classnames';

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
    order: 'punched',
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
        order: state.order,
      });
      console.log(comments);
      commentStore.updateComments(comments);
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
  }, [state.order]);

  const handleEditorChange = (content: string) => {
    localStorage.setItem(draftKey, content);
  };

  const submit = async (content: string) => {
    const comment = await submitComment({
      content,
      objectTrxId: object.TrxId,
    }, {
      head: true,
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
            placeholder="Post your comments here."
            submit={submit}
            saveDraft={handleEditorChange}
            smallSize
            buttonClassName="transform scale-90"
          />
        </div>
        <div className="mt-8 bg-white h-[50px] w-full flex items-center">
          <div
            className={classNames({
              'border-black text-black': state.order !== 'freshly',
              'border-transparent text-gray-9c': state.order === 'freshly',
            }, 'border-t-[5px] h-full w-37 flex items-center justify-center text-16 font-medium cursor-pointer')}
            onClick={() => {
              state.order = 'punched';
            }}
          >
            Most Punched
          </div>
          <div
            className={classNames({
              'border-black text-black': state.order === 'freshly',
              'border-transparent text-gray-9c': state.order !== 'freshly',
            }, 'border-t-[5px] h-full w-37 flex items-center justify-center text-16 font-medium cursor-pointer')}
            onClick={() => {
              state.order = 'freshly';
            }}
          >
            Freshly Posted
          </div>
          <div className="flex-grow flex items-center justify-end mr-5">
            <img className="mr-2" src={`${assetsBasePath}/reply.svg`} alt="" />
            <span className="text-black text-16">{comments ? comments.length : 0}</span>
          </div>
        </div>
        {comments.length > 0 && (
          <div id="comments" className="mt-2.5">
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

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Comments from './Comments';
import { useStore } from 'store';
import PostEditor from 'components/PostEditor';
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
import type { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { lang } from 'utils/lang';

export interface ISelectedCommentOptions {
  comment: IDbDerivedCommentItem
  scrollBlock: 'center' | 'start' | 'end'
  disabledHighlight?: boolean
}

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  selectedCommentOptions?: ISelectedCommentOptions
  showInTop?: boolean
}

export default observer((props: IProps) => {
  const { commentStore, activeGroupStore } = useStore();
  const { commentsGroupMap } = commentStore;
  const { object } = props;
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
      commentStore.updateComments(comments);
      state.loading = false;
      const { selectedCommentOptions } = props;
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
      } else if (props.showInTop) {
        await sleep(10);
        const commentsArea = document.querySelector(`#comment-section`);
        if (commentsArea) {
          commentsArea.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          });
        }
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
    if (!comment) {
      return;
    }
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
          <PostEditor
            profile={activeGroupStore.profile}
            value={state.value}
            minRows={1}
            placeholder={lang.publishYourComment}
            submit={submit}
            saveDraft={handleEditorChange}
            smallSize
            buttonClassName="transform scale-90"
          />
        </div>
        {comments.length > 0 && (
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
              {lang.hot}
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
              {lang.latest}
            </div>
            <div className="flex-grow flex items-center justify-end mr-5">
              <img className="mr-2" src={`${assetsBasePath}/reply.svg`} alt="" />
              <span className="text-black text-16">{comments ? comments.length : 0}</span>
            </div>
          </div>
        )}
        {comments.length > 0 && (
          <div id="comments" className="mt-2.5">
            <Comments
              comments={comments}
              object={object}
              inObjectDetailModal={props.inObjectDetailModal}
              selectedComment={props.selectedCommentOptions?.comment}
            />
          </div>
        )}
      </div>
    );
  };

  return renderMain();
});

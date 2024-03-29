import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@mui/material';
import { BsFillCaretDownFill } from 'react-icons/bs';
import { GoChevronRight } from 'react-icons/go';
import { useStore } from 'store';
import { BottomLine } from 'components';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import { IDBComment } from 'hooks/useDatabase/models/comment';
import { lang } from 'utils/lang';
import CommentItem from './CommentItem';

interface IProps {
  comments: IDBComment[]
  object: IDBPost
  inObjectDetailModal?: boolean
}

const PREVIEW_TOP_COMMENT_COUNT = 3;
const PREVIEW_SUB_COMMENT_COUNT = 2;

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    showSubCommentsMap: {} as Record<string, boolean>,
  }));
  const { commentStore, modalStore } = useStore();
  const { subCommentsGroupMap, newCommentIdsSet } = commentStore;
  const topComments = props.comments.filter((comment) => !comment.threadId);

  React.useEffect(() => {
    const { selectedCommentOptions } = modalStore.objectDetail.data;
    if (
      selectedCommentOptions
      && selectedCommentOptions.comment.threadId
    ) {
      state.showSubCommentsMap[
        selectedCommentOptions.comment.threadId
      ] = true;
    }
  }, []);

  const visibleTopComments = topComments.filter(
    (topComment, index) =>
      props.inObjectDetailModal
      || index < PREVIEW_TOP_COMMENT_COUNT
      || newCommentIdsSet.has(topComment.id),
  ).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      {visibleTopComments.map((comment) => {
        const subComments = subCommentsGroupMap[comment.id];
        const hasSubComments = subComments && subComments.length > 0;
        const visibleSubComments = (subComments || []).filter(
          (subComment, index) =>
            state.showSubCommentsMap[comment.id]
            || index < PREVIEW_SUB_COMMENT_COUNT
            || newCommentIdsSet.has(subComment.id),
        ).sort((a, b) => b.timestamp - a.timestamp);
        return (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              object={props.object}
              isTopComment
              inObjectDetailModal={props.inObjectDetailModal}
            />
            {hasSubComments && (
              <div className="border-l-2 border-gray-ec pl-2 mb-4 ml-[42px]">
                <Fade in={true} timeout={500}>
                  <div>
                    {visibleSubComments.map((subComment) => (
                      <div key={subComment.id}>
                        <CommentItem
                          comment={subComment}
                          object={props.object}
                          inObjectDetailModal={
                            props.inObjectDetailModal
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Fade>
                {!state.showSubCommentsMap[comment.id] && visibleSubComments.length < subComments.length && (
                  <span
                    className="text-blue-400 cursor-pointer text-13 flex items-center pl-8 ml-[2px] mt-[6px]"
                    onClick={action(() => {
                      state.showSubCommentsMap[comment.id] = !state.showSubCommentsMap[comment.id];
                    })}
                  >
                    {lang.totalReply(subComments.length)}{' '}
                    <BsFillCaretDownFill className="text-12 ml-[2px] opacity-70" />
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!props.inObjectDetailModal
        && topComments.length > PREVIEW_TOP_COMMENT_COUNT
        && visibleTopComments.length < topComments.length && (
        <div className="pt-10">
          <div
            className="text-center border-t border-gray-f2 pt-3 bg-white cursor-pointer flex items-center justify-center absolute bottom-3 left-0 w-full opacity-90"
            onClick={() => {
              modalStore.objectDetail.show({
                postId: props.object.id,
                selectedCommentOptions: {
                  comment: topComments[PREVIEW_TOP_COMMENT_COUNT],
                  scrollBlock: 'start',
                  disabledHighlight: true,
                },
              });
            }}
          >
            {lang.checkMoreComments(props.comments.length)}
            <GoChevronRight className="text-14 ml-1" />
          </div>
        </div>
      )}

      {props.inObjectDetailModal && topComments.length > 5 && (
        <div className="pt-5">
          <BottomLine />
        </div>
      )}
    </div>
  );
});

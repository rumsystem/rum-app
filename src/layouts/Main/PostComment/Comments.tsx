import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import CommentItem from './CommentItem';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { GoChevronRight } from 'react-icons/go';
import BottomLine from 'components/BottomLine';
import { action } from 'mobx';
import classNames from 'classnames';

interface IProps {
  comments: IDbDerivedCommentItem[]
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
}

const PREVIEW_TOP_COMMENT_COUNT = 3;
const PREVIEW_SUB_COMMENT_COUNT = 0;

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    showMenu: false,
    anchorEl: null,
    activeMenuComment: {} as any,
    showSubCommentsMap: {} as any,
    showTopCommentLoading: false,
    autoHandledQuery: false,
  }));
  const { comments } = props;
  const { commentStore, modalStore } = useStore();
  const { subCommentsGroupMap, newCommentIdsSet } = commentStore;
  const topComments = comments.filter(
    (comment) => !comment.Content.threadTrxId,
  );
  const visibleTopComments = topComments.filter(
    (topComment, index) =>
      props.inObjectDetailModal
      || index < PREVIEW_TOP_COMMENT_COUNT
      || newCommentIdsSet.has(topComment.TrxId),
  );

  React.useEffect(() => {
    const { selectedCommentOptions } = modalStore.objectDetail.data;
    if (
      selectedCommentOptions
      && selectedCommentOptions.comment.Content.threadTrxId
    ) {
      state.showSubCommentsMap[
        selectedCommentOptions.comment.Content.threadTrxId
      ] = true;
    }
  }, []);

  return (
    <div>
      {visibleTopComments.map((comment) => {
        const subComments = subCommentsGroupMap[comment.TrxId];
        const hasSubComments = subComments && subComments.length > 0;
        const visibleSubComments = (subComments || []).filter(
          (subComment, index) =>
            state.showSubCommentsMap[comment.TrxId]
            || index < PREVIEW_SUB_COMMENT_COUNT
            || newCommentIdsSet.has(subComment.TrxId),
        );
        const showSubComments = action(() => {
          state.showSubCommentsMap[comment.TrxId] = !state.showSubCommentsMap[comment.TrxId];
        });
        return (
          <div
            className={classNames({
              'pl-3 pb-2': hasSubComments,
            },
            'bg-gray-f2 mt-2.5')}
            key={comment.TrxId}
          >
            <CommentItem
              comment={comment}
              object={props.object}
              isTopComment
              inObjectDetailModal={props.inObjectDetailModal}
              showMore={!state.showSubCommentsMap[comment.TrxId] && visibleSubComments && subComments && visibleSubComments.length < subComments.length}
              showLess={state.showSubCommentsMap[comment.TrxId] && subComments && subComments.length > PREVIEW_SUB_COMMENT_COUNT}
              showSubComments={showSubComments}
              subCommentsCount={subComments ? subComments.length : 0}
            />
            {hasSubComments && (
              <div className="mt-[-1px] relative">
                <div>
                  <div>
                    <Fade in={true} timeout={500}>
                      <div>
                        {visibleSubComments.map(
                          (subComment: IDbDerivedCommentItem) => (
                            <div key={subComment.TrxId}>
                              <CommentItem
                                comment={subComment}
                                object={props.object}
                                inObjectDetailModal={
                                  props.inObjectDetailModal
                                }
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </Fade>
                  </div>
                </div>
              </div>
            )}
            <style jsx>{`
              .highlight {
                background: #e2f6ff;
              }
            `}</style>
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
                objectTrxId: props.object.TrxId,
                selectedCommentOptions: {
                  comment: topComments[PREVIEW_TOP_COMMENT_COUNT],
                  scrollBlock: 'start',
                  disabledHighlight: true,
                },
              });
            }}
          >
            {`共${comments.length}条评论，点击查看`}
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

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import urlify from 'utils/urlify';
import ago from 'utils/ago';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import { useStore } from 'store';
import { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import Avatar from 'components/Avatar';
import useSubmitVote from 'hooks/useSubmitVote';
import { IVoteType, IVoteObjectType } from 'apis/content';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import ContentSyncStatus from 'components/ContentSyncStatus';
import CommentMenu from 'components/CommentMenu';
import UserCard from 'components/UserCard';
import { assetsBasePath } from 'utils/env';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import Editor from 'components/Editor';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

interface IProps {
  comment: IDbDerivedCommentItem
  object: IDbDerivedObjectItem
  selectComment?: any
  highlight?: boolean
  isTopComment?: boolean
  disabledReply?: boolean
  inObjectDetailModal?: boolean
  standalone?: boolean
  showMore?: boolean
  showLess?: boolean
  showSubComments?: () => void
  subCommentsCount?: number
}

export default observer((props: IProps) => {
  const { commentStore, activeGroupStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const commentRef = React.useRef<any>();
  const { comment, isTopComment, disabledReply, showMore, showLess, showSubComments, subCommentsCount } = props;
  const isSubComment = !isTopComment;
  const { threadTrxId } = comment.Content;
  const { replyComment } = comment.Extra;
  const isOwner = comment.Publisher === activeGroup.user_pubkey;
  const domElementId = `comment_${
    props.inObjectDetailModal ? 'in_object_detail_modal' : ''
  }_${comment.TrxId}`;
  const highlight = domElementId === commentStore.highlightDomElementId;
  const enabledVote = false;

  const submitVote = useSubmitVote();
  const submitComment = useSubmitComment();
  const selectComment = useSelectComment();

  const state = useLocalObservable(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
    showEditor: false,
  }));

  React.useEffect(() => {
    if (commentRef.current) {
      replaceSeedAsButton(commentRef.current);
    }
    const setCanExpand = () => {
      if (
        commentRef.current
        && commentRef.current.scrollHeight > commentRef.current.clientHeight
      ) {
        state.canExpand = true;
      } else {
        state.canExpand = false;
      }
    };

    setCanExpand();
    window.addEventListener('resize', setCanExpand);
    return () => {
      window.removeEventListener('resize', setCanExpand);
    };
  }, [state, commentStore, comment.TrxId]);

  const submit = async (data: ISubmitObjectPayload) => {
    if (!comment) {
      return;
    }
    const newComment = await submitComment(
      {
        content: data.content,
        objectTrxId: comment.Content.objectTrxId,
        replyTrxId: comment.TrxId,
        threadTrxId: comment.Content.threadTrxId || comment.TrxId,
      },
      {
        head: true,
      },
    );
    if (!newComment) {
      return;
    }
    selectComment(newComment.TrxId, {
      inObjectDetailModal: props.inObjectDetailModal,
    });
  };

  const UserName = (props: {
    name: string
    isObjectOwner: boolean
    isTopComment?: boolean
    isReplyTo?: boolean
  }) => (
    <span
      className={classNames(
        {
          'bg-black text-white rounded opacity-50 px-1':
              props.isObjectOwner && !props.isReplyTo,
          'text-gray-500 opacity-80': !props.isObjectOwner || props.isReplyTo,
          'py-[3px] inline-block': props.isObjectOwner && props.isTopComment,
          'mr-[1px]': !props.isTopComment,
        },
        'text-13 font-bold',
      )}
    >
      {props.name}
    </span>
  );

  return (
    <div
      className={classNames(
        {
          highlight,
          'mt-[10px] pt-5 pb-2': isTopComment,
          'pl-3': isTopComment && !subCommentsCount,
          'mt-2 pl-3 pt-[15px] pb-[7px] bg-gray-f7 w-full': isSubComment,
        },
        'comment-item duration-500 ease-in-out group pr-2',
      )}
      id={`${domElementId}`}
    >
      <div className="relative">
        <UserCard
          object={props.comment}
        >
          <div
            className={classNames(
              {
                'mt-[-4px]': isTopComment,
                'mt-[-3px]': isSubComment,
              },
              'avatar absolute top-0 left-0',
            )}
          >
            <Avatar
              className="block"
              url={comment.Extra.user.profile.avatar}
              size={isSubComment ? 28 : 34}
            />
          </div>
        </UserCard>
        <div
          className={classNames({
            'ml-[7px]': isSubComment,
            'ml-3': !isSubComment,
          })}
          style={{ paddingLeft: isSubComment ? 28 : 34 }}
        >
          <div>
            <div className="flex items-center leading-none text-14 text-gray-99 relative">
              {!isSubComment && (
                <div className="relative">
                  <UserCard
                    object={props.comment}
                  >
                    <UserName
                      name={comment.Extra.user.profile.name}
                      isObjectOwner={
                        comment.Extra.user.publisher === props.object.Publisher
                      }
                      isTopComment
                    />
                  </UserCard>
                  <div className='flex flex-row-reverse items-center justify-start text-gray-af absolute top-[-2px] right-0'>
                    <div className="transform scale-75">
                      <ContentSyncStatus
                        status={comment.Status}
                        SyncedComponent={() => (
                          <div className={classNames({
                            'visible': comment.Status === ContentStatus.synced,
                          })}
                          >
                            <CommentMenu trxId={comment.TrxId} />
                          </div>
                        )}
                      />
                    </div>
                    <div
                      className="text-12 mr-3 tracking-wide opacity-90"
                    >
                      {ago(comment.TimeStamp)}
                    </div>
                  </div>
                </div>
              )}
              {isSubComment && (
                <div className="w-full">
                  <div
                    className={classNames(
                      {
                        'comment-expand': state.expand,
                      },
                      'comment-body comment text-gray-1e break-words whitespace-pre-wrap ml-[1px] comment-fold relative',
                    )}
                    ref={commentRef}
                  >
                    <UserName
                      name={comment.Extra.user.profile.name}
                      isObjectOwner={
                        comment.Extra.user.publisher === props.object.Publisher
                      }
                    />
                    {threadTrxId
                      && replyComment
                      && threadTrxId !== replyComment.TrxId ? (
                        <span>
                          <span className="opacity-80 mx-1">{lang.reply}</span>
                          <UserName
                            name={replyComment.Extra.user.profile.name}
                            isObjectOwner={
                              replyComment.Extra.user.publisher
                            === props.object.Publisher
                            }
                            isReplyTo
                          />
                        </span>
                      )
                      : ''}
                    <div className='flex flex-row-reverse items-center justify-start text-gray-af absolute top-[-2px] right-0'>
                      <div className="transform scale-75">
                        <ContentSyncStatus
                          status={comment.Status}
                          SyncedComponent={() => (
                            <CommentMenu trxId={comment.TrxId} />
                          )}
                        />
                      </div>
                      <div
                        className="text-12 mr-3 tracking-wide opacity-90"
                      >
                        {ago(comment.TimeStamp)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-[5px]">
            <div className="mb-1">
              <div
                className={classNames(
                  {
                    'comment-expand': state.expand,
                    'pr-1': isSubComment,
                  },
                  'comment-body comment text-gray-1e break-words whitespace-pre-wrap comment-fold',
                )}
                ref={commentRef}
                dangerouslySetInnerHTML={{
                  __html: urlify(comment.Content.content),
                }}
              />
              {!state.expand && state.canExpand && (
                <div
                  className="w-full text-center text-link-blue cursor-pointer pt-1 text-12"
                  onClick={() => { state.expand = true; }}
                >
                  {lang.expandContent}
                </div>
              )}
              {state.expand && state.canExpand && (
                <div
                  className="w-full text-center text-link-blue cursor-pointer pt-1 text-12"
                  onClick={() => { state.expand = false; }}
                >
                  {lang.unExpandContent}
                </div>
              )}
            </div>
            <div className="flex flex-row-reverse items-center text-gray-af leading-none relative w-full pr-1">
              <div
                className={classNames({
                  'hidden': !showMore && !showLess,
                },
                'flex items-center justify-end tracking-wide ml-12')}
              >
                {
                  showMore && (
                    <span
                      className="text-link-blue cursor-pointer text-13 flex items-center"
                      onClick={() => {
                        if (showSubComments) {
                          showSubComments();
                        }
                      }}
                    >
                      {lang.expandComments(subCommentsCount)}
                      <img className="ml-2" src={`${assetsBasePath}/fold_up.svg`} alt="" />
                    </span>
                  )
                }

                {
                  showLess && (
                    <span
                      className="text-link-blue cursor-pointer text-13 flex items-center"
                      onClick={() => {
                        if (showSubComments) {
                          showSubComments();
                        }
                      }}
                    >
                      <img src={`${assetsBasePath}/fold_down.svg`} alt="" />
                    </span>
                  )
                }
              </div>
              {!disabledReply && (
                <div
                  className={classNames({
                    'group-hover:visible': !state.showEditor,
                  },
                  'invisible',
                  'flex items-center cursor-pointer justify-center tracking-wide ml-12')}
                  onClick={() => {
                    state.showEditor = true;
                  }}
                >
                  <img className="mr-2" src={`${assetsBasePath}/reply.svg`} alt="" />
                  <span className="text-link-blue text-14">{lang.reply}</span>
                </div>
              )}
              {comment.Extra.user.profile.mixinUID && (
                <div
                  className={classNames(
                    'hidden group-hover:flex',
                    'flex items-center cursor-pointer justify-center tracking-wide ml-12',
                  )}
                  onClick={() => {
                    if (isOwner) {
                      snackbarStore.show({
                        message: lang.canNotTipYourself,
                        type: 'error',
                      });
                      return;
                    }
                    useMixinPayment({
                      name: comment.Extra.user.profile.name || '',
                      mixinUID: comment.Extra.user.profile.mixinUID || '',
                    });
                  }}
                >
                  <img className="mr-2" src={`${assetsBasePath}/buyadrink.svg`} alt="" />
                  <span className="text-link-blue text-14">{lang.tipWithRum}</span>
                </div>
              )}
              {enabledVote && (
                <div
                  className={classNames(
                    {
                      'hidden group-hover:flex': !isOwner && isSubComment,
                    },
                    'flex items-center cursor-pointer justify-center w-10 tracking-wide mr-1',
                  )}
                  onClick={() =>
                    !comment.Extra.voted
                    && submitVote({
                      type: IVoteType.up,
                      objectTrxId: comment.TrxId,
                      objectType: IVoteObjectType.comment,
                    })}
                >
                  <span className="flex items-center text-14 pr-1">
                    {comment.Extra.voted ? (
                      <RiThumbUpFill className="text-black opacity-60" />
                    ) : (
                      <RiThumbUpLine />
                    )}
                  </span>
                  <span className="text-12 text-gray-9b mr-[2px]">
                    {Number(comment.Extra.upVoteCount) || ''}
                  </span>
                </div>
              )}
            </div>
            {
              state.showEditor && (
                <div className="mt-[14px]">
                  <Editor
                    editorKey={`comment_${comment.TrxId}`}
                    profile={activeGroupStore.profile}
                    autoFocus={!isOwner && subCommentsCount === 0}
                    minRows={
                      subCommentsCount === 0 ? 3 : 1
                    }
                    placeholder={`${lang.reply} ${comment.Extra.user.profile.name}`}
                    submit={submit}
                    smallSize
                    buttonClassName="transform scale-90"
                    hideButtonDefault={false}
                    classNames="border-black rounded-l-none rounded-r-none"
                  />
                </div>
              )
            }
          </div>
        </div>
      </div>
      <style jsx>{`
        .name-max-width {
          max-width: 140px;
        }
        .gray {
          color: #8b8b8b;
        }
        .dark {
          color: #404040;
        }
        .highlight {
          background: #e2f6ff;
        }
        .comment-body {
          font-size: 14px;
          line-height: 1.625;
        }
        .comment-fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .comment-expand {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
        .more {
          height: 18px;
        }
        .top-label {
          top: -2px;
          right: -42px;
        }
        .top-label.md {
          right: -48px;
        }
        .comment-item {
          transition-property: background-color;
        }
        .comment-item .more-entry.md {
          display: none;
        }
        .comment-item:hover .more-entry.md {
          display: flex;
        }
      `}</style>
    </div>
  );
});

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
import { BsFillCaretDownFill } from 'react-icons/bs';
import useSubmitVote from 'hooks/useSubmitVote';
import { IVoteType, IVoteObjectType } from 'apis/group';
import ContentSyncStatus from 'components/ContentSyncStatus';
import CommentMenu from './CommentMenu';
import UserCard from 'components/UserCard';

interface IProps {
  comment: IDbDerivedCommentItem
  object: IDbDerivedObjectItem
  selectComment?: any
  highlight?: boolean
  isTopComment?: boolean
  disabledReply?: boolean
  inObjectDetailModal?: boolean
  standalone?: boolean
}

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
  }));
  const { commentStore, modalStore, nodeStore } = useStore();
  const commentRef = React.useRef<any>();
  const { comment, isTopComment, disabledReply } = props;
  const isSubComment = !isTopComment;
  const { threadTrxId } = comment.Content;
  const { replyComment } = comment.Extra;
  const isOwner = comment.Publisher === nodeStore.info.node_publickey;
  const domElementId = `comment_${
    props.inObjectDetailModal ? 'in_object_detail_modal' : ''
  }_${comment.TrxId}`;
  const highlight = domElementId === commentStore.highlightDomElementId;
  const enabledVote = false;

  const submitVote = useSubmitVote();

  React.useEffect(() => {
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
          'mt-[10px] p-2': isTopComment,
          'mt-1 px-2 py-[7px]': isSubComment,
        },
        'comment-item duration-500 ease-in-out -mx-2 rounded-6 group',
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
              profile={comment.Extra.user.profile}
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
                <div className="w-full relative">
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
                  {/* <div
                    className="truncate text-14 text-gray-88"
                    onClick={() => {
                      activeGroupStore.setObjectsFilter({
                        type: ObjectsFilterType.SOMEONE,
                        publisher: comment.Publisher,
                      });
                    }}
                  >
                    <UserName
                      name={comment.Extra.user.profile.name}
                      isObjectOwner={
                        comment.Extra.user.publisher === props.object.Publisher
                      }
                      isTopComment
                    />
                  </div> */}
                </div>
              )}
              {isSubComment && (
                <div>
                  <div
                    className={classNames(
                      {
                        'comment-expand': state.expand,
                      },
                      'comment-body comment text-gray-1e break-words whitespace-pre-wrap ml-[1px] comment-fold',
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
                          <span className="opacity-80 mx-1">回复</span>
                          <UserName
                            name={replyComment.Extra.user.profile.name}
                            isObjectOwner={
                              replyComment.Extra.user.publisher
                            === props.object.Publisher
                            }
                            isReplyTo
                          />
                          ：
                        </span>
                      )
                      : '：'}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: urlify(`${comment.Content.content}`),
                      }}
                    />
                  </div>

                  {!state.expand && state.canExpand && (
                    <div
                      className="text-blue-400 cursor-pointer pt-[6px] pb-[2px] ml-[1px] flex items-center text-12"
                      onClick={() => { state.expand = true; }}
                    >
                      展开
                      <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-[5px]">
            {!isSubComment && (
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
                    className="text-blue-400 cursor-pointer pt-1 flex items-center text-12"
                    onClick={() => { state.expand = true; }}
                  >
                    展开
                    <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center text-gray-af leading-none mt-2 h-3 relative w-full">
              <div
                className="text-12 mr-3 tracking-wide opacity-90"
              >
                {ago(comment.TimeStamp)}
              </div>
              {!isOwner && !disabledReply && (
                <span
                  className={classNames(
                    {
                      'hidden group-hover:flex': isSubComment,
                    },
                    'flex items-center cursor-pointer justify-center w-10 tracking-wide',
                  )}
                  onClick={() => {
                    modalStore.commentReply.show({
                      commentTrxId: comment.TrxId,
                    });
                  }}
                >
                  <span className="flex items-center text-12 pr-1">回复</span>
                </span>
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
              <div className='ml-2'>
                <ContentSyncStatus
                  status={comment.Status}
                  SyncedComponent={() => (
                    <CommentMenu trxId={comment.TrxId} />
                  )}
                />
              </div>
            </div>
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

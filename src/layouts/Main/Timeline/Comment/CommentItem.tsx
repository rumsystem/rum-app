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
import useSubmitLike from 'hooks/useSubmitLike';
import { LikeType } from 'apis/content';
import ContentSyncStatus from 'components/ContentSyncStatus';
import TrxInfo from 'components/TrxInfo';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import BFSReplace from 'utils/BFSReplace';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import Images from 'components/Images';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import Base64 from 'utils/base64';
import { Tooltip } from '@material-ui/core';
import useRumPayment from 'standaloneModals/useRumPayment';
import { BiDollarCircle } from 'react-icons/bi';

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
  const { commentStore, modalStore, fontStore } = useStore();
  const commentRef = React.useRef<HTMLDivElement>(null);
  const { comment, isTopComment, disabledReply } = props;
  const isSubComment = !isTopComment;
  const { threadTrxId } = comment.Content;
  const { replyComment } = comment.Extra;
  const domElementId = `comment_${
    props.inObjectDetailModal ? 'in_object_detail_modal' : ''
  }_${comment.TrxId}`;
  const highlight = domElementId === commentStore.highlightDomElementId;
  const liked = (comment.Extra.likedCount || 0) > (comment.Extra.dislikedCount || 0);
  const likeCount = (comment.Summary.likeCount || 0) - (comment.Summary.dislikeCount || 0);

  const submitLike = useSubmitLike();

  React.useEffect(() => {
    const box = commentRef.current;
    if (!box) {
      return;
    }

    BFSReplace(
      box,
      /(https?:\/\/[^\s]+)/g,
      (text: string) => {
        const link = document.createElement('a');
        link.href = text;
        link.className = 'text-blue-400';
        link.textContent = text;
        return link;
      },
    );

    replaceSeedAsButton(box);
  }, [comment.Content.content]);

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
        'font-bold',
      )}
      style={{
        fontSize: `${!props.isTopComment ? +fontStore.fontSize - 1 : 13}px`,
      }}
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
                </div>
              )}
              {isSubComment && (
                <div>
                  <div
                    className={classNames(
                      {
                        'comment-expand': state.expand,
                      },
                      'comment-body comment text-gray-1e break-all whitespace-pre-wrap ml-[1px] comment-fold',
                    )}
                    style={{
                      fontSize: `${fontStore.fontSize}px`,
                    }}
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
                          ：
                        </span>
                      )
                      : '：'}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: urlify(`${comment.Content.content}`),
                      }}
                    />
                    {comment.Content.image && (
                      <span
                        className="mx-[6px] text-blue-400 opacity-90 cursor-pointer"
                        onClick={() => {
                          openPhotoSwipe({
                            image: Base64.getUrl((comment.Content.image || [])[0]!),
                          });
                        }}
                      >
                        {lang.openImage}
                      </span>
                    )}
                  </div>

                  {!state.expand && state.canExpand && (
                    <div
                      className="text-blue-400 cursor-pointer pt-[6px] pb-[2px] ml-[1px] flex items-center text-12"
                      onClick={() => { state.expand = true; }}
                    >
                      {lang.expand}
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
                  style={{
                    fontSize: `${fontStore.fontSize}px`,
                  }}
                  ref={commentRef}
                  dangerouslySetInnerHTML={{
                    __html: comment.Content.content,
                  }}
                />

                {comment.Content.image && (
                  <div className="pt-2 pb-1">
                    <Images images={comment.Content.image} />
                  </div>
                )}

                {!state.expand && state.canExpand && (
                  <div
                    className="text-blue-400 cursor-pointer pt-1 flex items-center text-12"
                    onClick={() => { state.expand = true; }}
                  >
                    {lang.expand}
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
              {!disabledReply && (
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
                  <span className="flex items-center text-12 pr-1">{lang.reply}</span>
                </span>
              )}
              <div
                className={classNames(
                  {
                    'hidden group-hover:flex': isSubComment,
                  },
                  'flex items-center cursor-pointer justify-center w-10 tracking-wide leading-none',
                )}
                onClick={() =>
                  submitLike({
                    type: liked ? LikeType.Dislike : LikeType.Like,
                    objectTrxId: comment.TrxId,
                  })}
              >
                <span className="flex items-center text-14 pr-1">
                  {liked ? (
                    <RiThumbUpFill className="text-black opacity-60" />
                  ) : (
                    <RiThumbUpLine />
                  )}
                </span>
                <span className="text-12 text-gray-9b mr-[2px]">
                  {likeCount || ''}
                </span>
              </div>
              <Tooltip
                enterDelay={100}
                enterNextDelay={100}
                placement="right"
                title="打赏"
                arrow
              >
                <div
                  className={classNames(
                    {
                      'hidden group-hover:flex': isSubComment,
                      'text-amber-500': (comment.Extra.transferCount || 0) > 0,
                    },
                    'hover:text-amber-500 flex items-center cursor-pointer justify-center w-8 tracking-wide leading-none text-18',
                  )}
                  onClick={() => {
                    useRumPayment({
                      name: comment.Extra.user.profile.name || '',
                      avatar: comment.Extra.user.profile.avatar || '',
                      pubkey: comment.Extra.user.publisher || '',
                      uuid: comment.TrxId,
                    });
                  }}
                >
                  <BiDollarCircle />
                </div>
              </Tooltip>
              <div className='ml-4'>
                <ContentSyncStatus
                  trxId={comment.TrxId}
                  status={comment.Status}
                  SyncedComponent={() => (
                    <TrxInfo trxId={comment.TrxId} />
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

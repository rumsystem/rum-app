import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import urlify from 'utils/urlify';
import ago from 'utils/ago';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import { useStore } from 'store';
import { IDBComment } from 'hooks/useDatabase/models/comment';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import Avatar from 'components/Avatar';
import { BsFillCaretDownFill } from 'react-icons/bs';
import useSubmitCounter from 'hooks/useSubmitCounter';
import ContentSyncStatus from 'components/ContentSyncStatus';
import TrxInfo from 'components/TrxInfo';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import BFSReplace from 'utils/BFSReplace';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import Images from 'components/Images';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import Base64 from 'utils/base64';
import { Tooltip } from '@mui/material';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import { BiDollarCircle } from 'react-icons/bi';

interface IProps {
  comment: IDBComment
  object: IDBPost
  // selectComment?: any
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
  const threadId = comment.threadId;
  const replyComment = commentStore.map[comment.replyTo];
  const domElementId = `comment_${
    props.inObjectDetailModal ? 'in_object_detail_modal' : ''
  }_${comment.id}`;
  const highlight = domElementId === commentStore.highlightDomElementId;
  const liked = (comment.extra.likeCount || 0) > (comment.extra.dislikeCount || 0);
  const likeCount = (comment.summary.likeCount || 0) - (comment.summary.dislikeCount || 0);

  const submitCounter = useSubmitCounter();

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
  }, [comment.content]);

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
  }, [state, commentStore, comment.id]);

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
        'timeline-comment-item font-bold',
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
        highlight && 'highlight',
        isTopComment && 'mt-[10px] p-2',
        isSubComment && 'mt-1 px-2 py-[7px]',
        'comment-item duration-500 ease-in-out -mx-2 rounded-6 group',
      )}
      id={`${domElementId}`}
    >
      <div className="relative">
        <UserCard object={props.comment}>
          <div
            className={classNames(
              'avatar absolute top-0 left-0',
              isTopComment && 'mt-[-4px]',
              isSubComment && 'mt-[-3px]',
            )}
          >
            <Avatar
              className="block"
              avatar={comment.extra.user.avatar}
              size={isSubComment ? 28 : 34}
            />
          </div>
        </UserCard>

        <div
          className={classNames(
            isSubComment && 'ml-[7px]',
            !isSubComment && 'ml-3',
          )}
          style={{ paddingLeft: isSubComment ? 28 : 34 }}
        >
          <div>
            <div className="flex items-center leading-none text-14 text-gray-99 relative">
              {!isSubComment && (
                <div className="relative">
                  <UserCard object={props.comment}>
                    <UserName
                      name={comment.extra.user.name}
                      isObjectOwner={comment.extra.user.publisher === props.object.publisher}
                      isTopComment
                    />
                  </UserCard>
                </div>
              )}
              {isSubComment && (
                <div>
                  <div
                    className={classNames(
                      'comment-body comment text-gray-1e break-all whitespace-pre-wrap ml-[1px] comment-fold',
                      state.expand && 'comment-expand',
                    )}
                    style={{ fontSize: `${fontStore.fontSize}px` }}
                    ref={commentRef}
                  >
                    <UserName
                      name={comment.extra.user.name}
                      isObjectOwner={comment.extra.user.publisher === props.object.publisher}
                    />
                    {threadId && replyComment && threadId !== replyComment.id ? (
                      <span>
                        <span className="opacity-80 mx-1">{lang.reply}</span>
                        <UserName
                          name={replyComment.extra.user.name}
                          isObjectOwner={
                            replyComment.extra.user.publisher
                            === props.object.publisher
                          }
                          isReplyTo
                        />
                        ：
                      </span>
                    ) : '：'}
                    <span dangerouslySetInnerHTML={{ __html: urlify(`${comment.content}`) }} />
                    {!!comment.images?.length && (
                      <span
                        className="mx-[6px] text-blue-400 opacity-90 cursor-pointer"
                        onClick={() => openPhotoSwipe({
                          image: Base64.getUrl((comment.images || [])[0]!),
                        })}
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
                    'comment-body comment text-gray-1e break-words whitespace-pre-wrap comment-fold',
                    state.expand && 'comment-expand',
                    isSubComment && 'pr-1',
                  )}
                  style={{ fontSize: `${fontStore.fontSize}px` }}
                  ref={commentRef}
                  dangerouslySetInnerHTML={{
                    __html: comment.content,
                  }}
                />

                {!!comment.images?.length && (
                  <div className="pt-2 pb-1">
                    <Images images={comment.images} />
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
              <div className="text-12 mr-3 tracking-wide opacity-90">
                {ago(comment.timestamp)}
              </div>
              {!disabledReply && (
                <span
                  className={classNames(
                    isSubComment && 'hidden group-hover:flex',
                    'flex items-center cursor-pointer justify-center w-10 tracking-wide',
                  )}
                  onClick={() => modalStore.commentReply.show({ commentId: comment.id })}
                >
                  <span className="flex items-center text-12 pr-1">{lang.reply}</span>
                </span>
              )}
              <div
                className={classNames(
                  isSubComment && 'hidden group-hover:flex',
                  'flex items-center cursor-pointer justify-center w-10 tracking-wide leading-none',
                )}
                onClick={() =>
                  submitCounter({
                    type: liked ? 'undolike' : 'like',
                    objectId: comment.id,
                  })}
              >
                <span className="flex items-center text-14 pr-1">
                  {liked && <RiThumbUpFill className="text-black opacity-60" />}
                  {!liked && <RiThumbUpLine />}
                </span>
                <span className="text-12 text-gray-9b mr-[2px]">
                  {likeCount || ''}
                </span>
              </div>
              <Tooltip
                enterDelay={1000}
                enterNextDelay={1000}
                placement="right"
                title="打赏"
                arrow
                disableInteractive
              >
                <div
                  className={classNames(
                    isSubComment && 'hidden group-hover:flex',
                    (comment.extra.transferCount || 0) > 0 && 'text-amber-500',
                    'hover:text-amber-500 flex items-center cursor-pointer justify-center w-8 tracking-wide leading-none text-18',
                  )}
                  onClick={() => {
                    openTransferModal({
                      name: comment.extra.user.name || '',
                      avatar: comment.extra.user.avatar || '',
                      pubkey: comment.extra.user.publisher || '',
                      uuid: comment.id,
                    });
                  }}
                >
                  <BiDollarCircle />
                </div>
              </Tooltip>
              <div className='ml-4'>
                <ContentSyncStatus
                  trxId={comment.trxId}
                  status={comment.status}
                  SyncedComponent={() => (
                    <TrxInfo trxId={comment.trxId} />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .timeline-comment-item .name-max-width {
          max-width: 140px;
        }
        .timeline-comment-item .gray {
          color: #8b8b8b;
        }
        .timeline-comment-item .dark {
          color: #404040;
        }
        .timeline-comment-item .highlight {
          background: #e2f6ff;
        }
        .timeline-comment-item .comment-body {
          line-height: 1.625;
        }
        .timeline-comment-item .comment-fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .timeline-comment-item .comment-expand {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
        .timeline-comment-item .more {
          height: 18px;
        }
        .timeline-comment-item .top-label {
          top: -2px;
          right: -42px;
        }
        .timeline-comment-item .top-label.md {
          right: -48px;
        }
        .timeline-comment-item .comment-item {
          transition-property: background-color;
        }
        .timeline-comment-item .comment-item .more-entry.md {
          display: none;
        }
        .timeline-comment-item .comment-item:hover .more-entry.md {
          display: flex;
        }
      `}</style>
    </div>
  );
});

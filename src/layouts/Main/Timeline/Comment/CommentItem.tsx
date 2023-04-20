import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import { Tooltip } from '@mui/material';

import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import { BsFillCaretDownFill } from 'react-icons/bs';
import { BiDollarCircle } from 'react-icons/bi';

import { Avatar, ContentSyncStatus, TrxInfo, UserCard, Images } from 'components';

import { IDBComment } from 'hooks/useDatabase/models/comment';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import useSubmitCounter from 'hooks/useSubmitCounter';

import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import { useStore } from 'store';

import urlify from 'utils/urlify';
import ago from 'utils/ago';
import { lang } from 'utils/lang';
import BFSReplace from 'utils/BFSReplace';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import Base64 from 'utils/base64';


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
  const commentContentRef = React.useRef<HTMLSpanElement>(null);
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
    if (!box) { return; }

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
    const setCanExpand = action(() => {
      const contentHeight = commentContentRef.current?.offsetHeight ?? 0;
      const boxHeight = commentRef.current?.clientHeight ?? 0;
      const canExpand = contentHeight > boxHeight;
      state.canExpand = canExpand;
    });

    setCanExpand();
    window.addEventListener('resize', setCanExpand);
    return () => {
      window.removeEventListener('resize', setCanExpand);
    };
  }, [state, commentStore, comment.id]);

  const renderUserName = (props: {
    name: string
    isObjectOwner: boolean
    isTopComment?: boolean
    isReplyTo?: boolean
  }) => (
    <span
      className={classNames(
        'font-bold',
        props.isObjectOwner && !props.isReplyTo && 'bg-black text-white rounded opacity-50 px-1',
        (!props.isObjectOwner || props.isReplyTo) && 'text-gray-500 opacity-80',
        props.isObjectOwner && props.isTopComment && 'py-[3px] inline-block',
        !props.isTopComment && 'mr-[1px]',
      )}
      style={{ fontSize: `${!props.isTopComment ? +fontStore.fontSize - 1 : 13}px` }}
    >
      {props.name}
    </span>
  );

  return (
    <div
      className={classNames(
        highlight && 'bg-[#e2f6ff]',
        isTopComment && 'mt-[10px] p-2',
        isSubComment && 'mt-1 px-2 py-[7px]',
        'comment-item relative duration-500 ease-in-out -mx-2 rounded-6 group',
      )}
      id={`${domElementId}`}
    >
      <UserCard object={props.comment}>
        <div
          className={classNames(
            'avatar absolute top-2 left-2',
            isTopComment && 'mt-[-5px]',
            isSubComment && 'mt-[-4px]',
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
        <div className="flex items-center text-14 text-gray-99 relative">
          {!isSubComment && (
            <div className="relative">
              <UserCard object={props.comment}>
                {renderUserName({
                  name: comment.extra.user.name,
                  isObjectOwner: comment.extra.user.publisher === props.object.publisher,
                  isTopComment: true,
                })}
              </UserCard>
            </div>
          )}
          {isSubComment && (
            <div>
              <div
                className={classNames(
                  'text-gray-1e break-all whitespace-pre-wrap ml-[1px] comment-fold',
                  !state.expand && 'truncate-3',
                )}
                style={{ fontSize: `${fontStore.fontSize}px` }}
                ref={commentRef}
              >
                {renderUserName({
                  name: comment.extra.user.name,
                  isObjectOwner: comment.extra.user.publisher === props.object.publisher,
                })}
                {threadId && replyComment && threadId !== replyComment.id && (
                  <span>
                    <span className="opacity-80 px-1">{lang.reply}</span>
                    {renderUserName({
                      name: replyComment.extra.user.name,
                      isObjectOwner: replyComment.extra.user.publisher === props.object.publisher,
                      isReplyTo: true,
                    })}
                  </span>
                )}
                <span>：</span>
                <span ref={commentContentRef}>
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
                </span>
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

        <div className="mt-[5px]">
          {!isSubComment && (
            <div className="mb-1">
              <div
                className={classNames(
                  'text-gray-1e break-words whitespace-pre-wrap',
                  !state.expand && 'truncate-4',
                  isSubComment && 'pr-1',
                )}
                style={{ fontSize: `${fontStore.fontSize}px` }}
                ref={commentRef}
              >
                <span
                  ref={commentContentRef}
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>

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
              onClick={() => submitCounter({
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

            <Tooltip title="打赏" enterDelay={1000} enterNextDelay={1000} placement="right" arrow disableInteractive>
              <div
                className={classNames(
                  isSubComment && 'hidden group-hover:flex',
                  (comment.extra.transferCount || 0) > 0 && 'text-amber-500',
                  'hover:text-amber-500 flex items-center cursor-pointer justify-center w-8 tracking-wide leading-none text-18',
                )}
                onClick={() => openTransferModal({
                  name: comment.extra.user.name || '',
                  avatar: comment.extra.user.avatar || '',
                  pubkey: comment.extra.user.publisher || '',
                  uuid: comment.id,
                })}
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
  );
});

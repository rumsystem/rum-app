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
import useSubmitCounter from 'hooks/useSubmitCounter';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import ContentSyncStatus from 'components/ContentSyncStatus';
import TrxInfo from 'components/TrxInfo';
import UserCard from 'components/UserCard';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import Editor from 'components/Editor';
import useSubmitComment from 'hooks/useSubmitComment';
import useSelectComment from 'hooks/useSelectComment';
import { ISubmitObjectPayload } from 'hooks/useSubmitPost';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import Images from 'components/Images';
import IconFoldUp from 'assets/fold_up.svg';
import IconFoldDown from 'assets/fold_down.svg';
import IconReply from 'assets/reply.svg';
import IconBuyADrink from 'assets/buyadrink.svg';

interface IProps {
  comment: IDBComment
  post: IDBPost
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
  const { commentStore, activeGroupStore, fontStore } = useStore();
  const activeGroup = useActiveGroup();
  const commentRef = React.useRef<any>();
  const { comment, isTopComment, disabledReply, showMore, showLess, showSubComments, subCommentsCount } = props;
  const isSubComment = !isTopComment;
  const threadId = comment.threadId;
  const replyComment = commentStore.map[comment.replyTo];
  const isOwner = comment.publisher === activeGroup.user_pubkey;
  const domElementId = `comment_${
    props.inObjectDetailModal ? 'in_object_detail_modal' : ''
  }_${comment.id}`;
  const highlight = domElementId === commentStore.highlightDomElementId;
  const liked = (comment.extra.likeCount || 0) > (comment.extra.dislikeCount || 0);
  const likeCount = (comment.summary.likeCount || 0) - (comment.summary.dislikeCount || 0);

  const submitCounter = useSubmitCounter();
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
  }, [state, commentStore, comment.id]);

  const submit = async (data: ISubmitObjectPayload) => {
    if (!comment) {
      return false;
    }
    try {
      const newComment = await submitComment({
        postId: comment.postId,
        replyTo: comment.id,
        threadId: comment.threadId || comment.id,
        content: data.content,
        image: data.image,
      }, { head: true });
      if (newComment) {
        selectComment(newComment.id, {
          inObjectDetailModal: props.inObjectDetailModal,
        });
      }
      return true;
    } catch (_) {
      return false;
    }
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
        'comment-item forum-comment-item duration-500 ease-in-out group pr-2',
        highlight && 'highlight',
        isTopComment && 'mt-[10px] pt-5 pb-2',
        isTopComment && !subCommentsCount && 'pl-3',
        isSubComment && 'mt-2 pl-3 pt-[15px] pb-[7px] bg-gray-f7 w-full',
      )}
      id={`${domElementId}`}
    >
      <div className="relative">
        <UserCard
          object={props.comment}
        >
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
                <div className="relative w-full">
                  <UserCard object={props.comment}>
                    <UserName
                      name={comment.extra.user.name}
                      isObjectOwner={comment.extra.user.publisher === props.post.publisher}
                      isTopComment
                    />
                  </UserCard>
                  <div className='flex flex-row-reverse items-center justify-start text-gray-af absolute top-[-2px] right-0'>
                    <div className="scale-75">
                      <ContentSyncStatus
                        trxId={comment.trxId}
                        status={comment.status}
                        SyncedComponent={() => (
                          <div className={classNames(comment.status === ContentStatus.synced && 'visible')}>
                            <div className="scale-125">
                              <TrxInfo trxId={comment.trxId} />
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <div className="text-12 mr-3 tracking-wide opacity-90">
                      {ago(comment.timestamp)}
                    </div>
                  </div>
                </div>
              )}
              {isSubComment && (
                <div className="w-full">
                  <div
                    className={classNames(
                      'comment-body comment text-gray-1e break-words whitespace-pre-wrap ml-[1px] comment-fold relative',
                      state.expand && 'comment-expand',
                    )}
                    style={{ fontSize: `${fontStore.fontSize}px` }}
                    ref={commentRef}
                  >
                    <UserName
                      name={comment.extra.user.name}
                      isObjectOwner={comment.extra.user.publisher === props.post.publisher}
                    />
                    {threadId && replyComment && threadId !== replyComment.id && (
                      <span>
                        <span className="opacity-80 mx-1">{lang.reply}</span>
                        <UserName
                          name={replyComment.extra.user.name}
                          isObjectOwner={
                            replyComment.extra.user.publisher
                            === props.post.publisher
                          }
                          isReplyTo
                        />
                      </span>
                    )}
                    <div className='flex flex-row-reverse items-center justify-start text-gray-af absolute top-[-2px] right-0'>
                      <div className="scale-75">
                        <ContentSyncStatus
                          trxId={comment.trxId}
                          status={comment.status}
                          SyncedComponent={() => (
                            <div className="scale-125">
                              <TrxInfo trxId={comment.trxId} />
                            </div>
                          )}
                        />
                      </div>
                      <div className="text-12 mr-3 tracking-wide opacity-90">
                        {ago(comment.timestamp)}
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
                  'comment-body comment text-gray-1e break-words whitespace-pre-wrap comment-fold',
                  state.expand && 'comment-expand',
                  isSubComment && 'pr-1',
                )}
                style={{
                  fontSize: `${fontStore.fontSize}px`,
                }}
                ref={commentRef}
                dangerouslySetInnerHTML={{ __html: urlify(comment.content) }}
              />
              {!!comment.images?.length && (
                <div className="pt-2 pb-1">
                  <Images images={comment.images} />
                </div>
              )}
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
            <div className="flex justify-between py-1">
              <div
                className={classNames(
                  'flex items-center cursor-pointer w-10 tracking-wide text-gray-88 leading-none',
                  isSubComment && 'hidden group-hover:flex',
                )}
                onClick={() =>
                  submitCounter({
                    type: liked ? 'undolike' : 'like',
                    objectId: comment.id,
                  })}
              >
                <span className="flex items-center text-14 pr-1">
                  {liked && <RiThumbUpFill className="opacity-80" />}
                  {!liked && <RiThumbUpLine />}
                </span>
                <span className="text-12 text-gray-9b mr-[2px]">
                  {likeCount || ''}
                </span>
              </div>
              <div className="flex flex-row-reverse items-center text-gray-af leading-none relative w-full pr-1">
                <div
                  className={classNames(
                    'flex items-center justify-end tracking-wide ml-12',
                    !showMore && !showLess && 'hidden',
                  )}
                >
                  {showMore && (
                    <span
                      className="text-link-blue cursor-pointer text-13 flex items-center"
                      onClick={() => {
                        if (showSubComments) { showSubComments(); }
                      }}
                    >
                      {lang.expandComments(subCommentsCount)}
                      <img className="ml-2" src={IconFoldUp} alt="" />
                    </span>
                  )}

                  {showLess && (
                    <span
                      className="text-link-blue cursor-pointer text-13 flex items-center"
                      onClick={() => {
                        if (showSubComments) { showSubComments(); }
                      }}
                    >
                      <img src={IconFoldDown} alt="" />
                    </span>
                  )}
                </div>
                {!disabledReply && (
                  <div
                    className={classNames(
                      !state.showEditor && 'group-hover:visible',
                      'invisible',
                      'flex items-center cursor-pointer justify-center tracking-wide ml-12',
                    )}
                    onClick={() => { state.showEditor = true; }}
                  >
                    <img className="mr-2" src={IconReply} alt="" />
                    <span className="text-link-blue text-13">{lang.reply}</span>
                  </div>
                )}
                <div
                  className={classNames(
                    'hidden group-hover:flex',
                    'flex items-center cursor-pointer justify-center tracking-wide ml-12',
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
                  <img className="mr-2" src={IconBuyADrink} alt="" />
                  <span className="text-link-blue text-14">{lang.tipWithRum}</span>
                </div>
              </div>
            </div>
            {
              state.showEditor && (
                <div className="mt-[14px]">
                  <Editor
                    editorKey={`comment_${comment.id}`}
                    profile={activeGroupStore.profile}
                    autoFocus={!isOwner && subCommentsCount === 0}
                    minRows={
                      subCommentsCount === 0 ? 3 : 1
                    }
                    placeholder={`${lang.reply} ${comment.extra.user.name}`}
                    submit={submit}
                    smallSize
                    buttonClassName="scale-90"
                    hideButtonDefault={false}
                    classNames="border-black rounded-l-none rounded-r-none"
                    enabledImage
                    imagesClassName='ml-12'
                  />
                </div>
              )
            }
          </div>
        </div>
      </div>
      <style>{`
        .forum-comment-item .name-max-width {
          max-width: 140px;
        }
        .forum-comment-item .gray {
          color: #8b8b8b;
        }
        .forum-comment-item .dark {
          color: #404040;
        }
        .forum-comment-item .highlight {
          background: #e2f6ff;
        }
        .forum-comment-item .comment-body {
          line-height: 1.625;
        }
        .forum-comment-item .comment-fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .forum-comment-item .comment-expand {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
        .forum-comment-item .more {
          height: 18px;
        }
        .forum-comment-item .top-label {
          top: -2px;
          right: -42px;
        }
        .forum-comment-item .top-label.md {
          right: -48px;
        }
        .forum-comment-item .comment-item {
          transition-property: background-color;
        }
        .forum-comment-item .comment-item .more-entry.md {
          display: none;
        }
        .forum-comment-item .comment-item:hover .more-entry.md {
          display: flex;
        }
      `}</style>
    </div>
  );
});

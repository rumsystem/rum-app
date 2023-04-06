import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FaRegComment, FaComment } from 'react-icons/fa';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Comment from './Comment';
import ago from 'utils/ago';
import { useStore } from 'store';
import { Fade, Tooltip } from '@mui/material';
import useSubmitCounter from 'hooks/useSubmitCounter';
import classNames from 'classnames';
import ContentSyncStatus from 'components/ContentSyncStatus';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import { BiDollarCircle } from 'react-icons/bi';
import ObjectMenu from '../ObjectMenu';
import OpenObjectEditor from './OpenObjectEditor';
import useDeletePost from 'hooks/useDeletePost';

interface IProps {
  custom?: boolean
  object: IDBPost
  inObjectDetailModal?: boolean
}

export default observer((props: IProps) => {
  const { object } = props;
  const { modalStore, activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    showComment: props.inObjectDetailModal || false,
  }));
  const { profileMap } = activeGroupStore;
  const profile = profileMap[object.publisher] || object.extra.user;
  const liked = (object.extra?.likeCount || 0) > (object.extra.dislikeCount || 0);
  const likeCount = (object.summary.likeCount || 0) - (object.summary.dislikeCount || 0);
  const submitCounter = useSubmitCounter();
  const deletePost = useDeletePost();

  return (
    <div>
      <div className="pl-12 ml-1 flex items-center text-gray-88 leading-none text-12">
        <div
          className="text-12 tracking-wide cursor-pointer mr-[20px] mt-[-1px] opacity-80"
          onClick={() => {
            modalStore.objectDetail.show({
              postId: object.id,
            });
          }}
        >
          {ago(object.timestamp)}
        </div>
        {!props.custom && (
          <>
            <div
              className={classNames(
                {
                  'text-gray-34': state.showComment,
                },
                'flex items-center p-3 mr-3 cursor-pointer tracking-wide hover:text-gray-33 mt-[-1px]',
              )}
              onClick={() => {
                if (props.inObjectDetailModal) {
                  return;
                }
                state.showComment = !state.showComment;
              }}
              data-test-id="timeline-object-comment-button"
            >
              <div className="text-17 mr-[6px] opacity-90">
                {state.showComment ? (
                  <FaComment className="text-black opacity-61" />
                ) : (
                  <FaRegComment />
                )}
              </div>
              {object.summary.commentCount ? (
                <span className="mr-2">{object.summary.commentCount}</span>
              )
                : '评论'}
            </div>
            <div
              className={classNames(
                {
                  'text-gray-34': liked,
                },
                'flex items-center p-3 mr-5 cursor-pointer tracking-wide hover:text-gray-33',
              )}
              onClick={() => {
                submitCounter({
                  type: liked ? 'undolike' : 'like',
                  objectId: object.id,
                });
              }}
            >
              <div className="text-17 mr-[6px] opacity-90">
                {liked ? (
                  <RiThumbUpFill className="text-black opacity-61" />
                ) : (
                  <RiThumbUpLine />
                )}
              </div>
              {likeCount ? (
                <span className="mr-2">{likeCount || ''}</span>
              )
                : '赞'}
            </div>
            <Tooltip
              enterDelay={998}
              enterNextDelay={998}
              placement="right"
              title="打赏"
              arrow
              disableInteractive
            >
              <div
                className={classNames(
                  'cursor-pointer text-20 mt-[-1px] opacity-80 hover:text-amber-500 hover:opacity-100 mr-7',
                  (object.extra.transferCount || 0) > 0 && 'text-amber-502',
                )}
                onClick={() => {
                  openTransferModal({
                    name: profile.name || '',
                    avatar: profile.avatar || '',
                    pubkey: object.extra.user.publisher || '',
                    uuid: object.id,
                  });
                }}
              >
                <BiDollarCircle />
              </div>
            </Tooltip>
          </>
        )}
        <div className="mt-[-1px]">
          <ContentSyncStatus
            trxId={object.id}
            status={object.status}
            SyncedComponent={() => (
              <div className="">
                <ObjectMenu
                  object={object}
                  onClickUpdateMenu={() => {
                    OpenObjectEditor(object);
                  }}
                  onClickDeleteMenu={() => {
                    deletePost(object.id);
                  }}
                />
              </div>
            )}
            alwaysShow
          />
        </div>
      </div>
      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div className="mt-4 pb-2">
            <Comment
              post={object}
              inObjectDetailModal={props.inObjectDetailModal}
            />
          </div>
        </Fade>
      )}
    </div>
  );
});

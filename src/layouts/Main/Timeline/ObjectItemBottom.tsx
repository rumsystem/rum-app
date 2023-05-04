import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade, Tooltip } from '@mui/material';
import { FaRegComment, FaComment } from 'react-icons/fa';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import { BiDollarCircle } from 'react-icons/bi';
import { TiArrowForwardOutline } from 'react-icons/ti';

import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import ContentSyncStatus from 'components/ContentSyncStatus';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import useSubmitCounter from 'hooks/useSubmitCounter';
import useDeletePost from 'hooks/useDeletePost';
import { useStore } from 'store';
import { lang, ago } from 'utils';

import Comment from './Comment';
import ObjectMenu from '../ObjectMenu';
import OpenObjectEditor from './OpenObjectEditor';

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
      <div className="flex items-center text-gray-88 leading-none text-12 -mb-1">
        <div
          className="text-12 tracking-wide cursor-pointer mr-[20px] mt-[-1px] opacity-80"
          onClick={() => modalStore.objectDetail.show({ postId: object.id })}
        >
          {ago(object.timestamp)}
        </div>
        {!props.custom && (<>
          <div
            className="flex items-center px-3 py-2 cursor-pointer tracking-wide hover:text-gray-33 mt-[-1px]"
            onClick={action(() => {
              if (props.inObjectDetailModal) { return; }
              state.showComment = !state.showComment;
            })}
            data-test-id="timeline-object-comment-button"
          >
            <div className="text-17 mr-[6px] opacity-90">
              {state.showComment && <FaComment />}
              {!state.showComment && <FaRegComment />}
            </div>
            {!!object.summary.commentCount && <span className="mr-2">{object.summary.commentCount}</span>}
            {!object.summary.commentCount && <span className="mr-3">{lang.comment}</span>}
          </div>

          <div
            className="flex items-center px-3 py-2 cursor-pointer tracking-wide hover:text-gray-33 min-w-[70px]"
            onClick={() => submitCounter({ type: liked ? 'undolike' : 'like', objectId: object.id })}
          >
            <div className="text-17 mr-[6px] opacity-90">
              {liked && <RiThumbUpFill />}
              {!liked && <RiThumbUpLine />}
            </div>
            {!!likeCount && <span className="mr-2">{likeCount || ''}</span>}
            {!likeCount && lang.like}
          </div>

          <div
            className="flex items-center px-3 py-2 cursor-pointer tracking-wide hover:text-gray-33 min-w-[70px]"
            onClick={() => OpenObjectEditor({ forwardPostId: object.id })}
          >
            <div className="mr-[6px] text-20 opacity-90">
              <TiArrowForwardOutline />
            </div>
            {object.forwardCount || lang.forward}
          </div>

          <Tooltip enterDelay={998} enterNextDelay={998} placement="right" title={lang.tip} arrow disableInteractive>
            <div
              className={classNames(
                'cursor-pointer text-20 opacity-80 hover:text-amber-500 hover:opacity-100 py-2 px-3',
                (object.extra.transferCount || 0) > 0 && 'text-amber-502',
              )}
              onClick={() => openTransferModal({
                name: profile.name || '',
                avatar: profile.avatar || '',
                pubkey: object.extra.user.publisher || '',
                uuid: object.id,
              })}
            >
              <BiDollarCircle />
            </div>
          </Tooltip>
        </>)}

        <div className="px-2">
          <ContentSyncStatus
            trxId={object.id}
            status={object.status}
            alwaysShow
            SyncedComponent={() => (
              <div className="">
                <ObjectMenu
                  object={object}
                  // onClickUpdateMenu={() => OpenObjectEditor(object)}
                  onClickDeleteMenu={() => deletePost(object.id)}
                />
              </div>
            )}
          />
        </div>
      </div>

      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div className="mt-4 pb-2 -ml-[52px]">
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

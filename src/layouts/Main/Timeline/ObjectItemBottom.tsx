import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FaRegComment, FaComment } from 'react-icons/fa';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Comment from './Comment';
import ago from 'utils/ago';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import useSubmitLike from 'hooks/useSubmitLike';
import { LikeType } from 'apis/content';
import classNames from 'classnames';
import ContentSyncStatus from 'components/ContentSyncStatus';
import TrxInfo from 'components/TrxInfo';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import { BiDollarCircle } from 'react-icons/bi';
import { Tooltip } from '@material-ui/core';
import { lang } from 'utils/lang';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
}

export default observer((props: IProps) => {
  const { object } = props;
  const { modalStore, activeGroupStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    showComment: props.inObjectDetailModal || false,
  }));
  const activeGroup = useActiveGroup();
  const { profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher] || object.Extra.user.profile;
  const isMySelf = activeGroup.user_pubkey === object.Extra.user.publisher;
  const submitLike = useSubmitLike();

  return (
    <div>
      <div className="pl-12 ml-1 flex items-center text-gray-88 leading-none text-12">
        <div
          className="text-12 tracking-wide cursor-pointer mr-[20px] mt-[-1px] opacity-80"
          onClick={() => {
            modalStore.objectDetail.show({
              objectTrxId: object.TrxId,
            });
          }}
        >
          {ago(object.TimeStamp)}
        </div>
        <div
          className={classNames(
            {
              'text-gray-33': state.showComment,
            },
            'flex items-center p-2 mr-3 cursor-pointer tracking-wide hover:text-gray-33 mt-[-1px]',
          )}
          onClick={() => {
            if (props.inObjectDetailModal) {
              return;
            }
            state.showComment = !state.showComment;
          }}
        >
          <div className="text-16 mr-[6px] opacity-90">
            {state.showComment ? (
              <FaComment className="text-black opacity-60" />
            ) : (
              <FaRegComment />
            )}
          </div>
          {object.commentCount ? (
            <span className="mr-1">{object.commentCount}</span>
          )
            : '评论'}
        </div>
        <div
          className={classNames(
            {
              'text-gray-33': object.Extra.liked,
            },
            'flex items-center p-2 mr-3 cursor-pointer tracking-wide hover:text-gray-33',
          )}
          onClick={() => {
            submitLike({
              type: object.Extra.liked ? LikeType.Dislike : LikeType.Like,
              objectTrxId: object.TrxId,
            });
          }}
        >
          <div className="text-16 mr-[6px] opacity-90">
            {object.Extra.liked ? (
              <RiThumbUpFill className="text-black opacity-60" />
            ) : (
              <RiThumbUpLine />
            )}
          </div>
          {object.likeCount ? (
            <span className="mr-1">{object.likeCount}</span>
          )
            : '赞'}
        </div>
        {!!profile?.mixinUID && (
          <Tooltip
            enterDelay={100}
            enterNextDelay={100}
            placement="right"
            title="打赏"
            arrow
          >
            <div
              className="cursor-pointer text-18 ml-[2px] mt-[-1px] opacity-80 hover:text-yellow-500 hover:opacity-100 mr-4"
              onClick={() => {
                if (isMySelf) {
                  snackbarStore.show({
                    message: lang.canNotTipYourself,
                    type: 'error',
                  });
                  return;
                }
                useMixinPayment({
                  name: profile.name || '',
                  mixinUID: profile.mixinUID || '',
                });
              }}
            >
              <BiDollarCircle />
            </div>
          </Tooltip>
        )}
        <div className="ml-1">
          <ContentSyncStatus
            status={object.Status}
            SyncedComponent={() => <TrxInfo trxId={object.TrxId} />}
            alwaysShow
          />
        </div>
      </div>
      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div className="mt-4 pb-2">
            <Comment
              object={object}
              inObjectDetailModal={props.inObjectDetailModal}
            />
          </div>
        </Fade>
      )}
    </div>
  );
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FaRegComment } from 'react-icons/fa';
import { FiThumbsUp } from 'react-icons/fi';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { RiThumbUpLine, RiThumbUpFill } from 'react-icons/ri';
import Comment from './Comment';
import { ago } from 'utils';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import useSubmitVote from 'hooks/useSubmitVote';
import { IVoteType, IVoteObjectType } from 'apis/group';
import classNames from 'classnames';

interface IProps {
  object: IDbDerivedObjectItem;
  inObjectDetailModal?: boolean;
}

export default observer((props: IProps) => {
  const { object } = props;
  const { modalStore } = useStore();
  const state = useLocalObservable(() => ({
    showComment: props.inObjectDetailModal || false,
  }));
  const submitVote = useSubmitVote();

  return (
    <div>
      <div className="pl-12 ml-2 flex items-center mt-2 text-gray-88 leading-none text-12">
        <div
          className="text-12 tracking-wide cursor-pointer mr-[22px] mt-[-1px] opacity-80"
          onClick={() => {
            modalStore.objectDetail.show({
              objectTrxId: object.TrxId,
            });
          }}
        >
          {ago(object.TimeStamp)}
        </div>
        <div
          className="flex items-center p-2 mr-3 cursor-pointer tracking-wide hover:text-black mt-[-1px]"
          onClick={() => {
            if (props.inObjectDetailModal) {
              return;
            }
            state.showComment = !state.showComment;
          }}
        >
          <FaRegComment className="text-16 mr-[6px] opacity-90" />
          {object.Extra.commentCount ? (
            <span className="mr-1">{object.Extra.commentCount}</span>
          ) : (
            '评论'
          )}
        </div>
        <div
          className="flex items-center p-2 cursor-pointer tracking-wide hover:text-black"
          onClick={() => {
            if (object.Extra.voted) {
              return;
            }
            submitVote({
              type: IVoteType.up,
              objectTrxId: object.TrxId,
              objectType: IVoteObjectType.object,
            });
          }}
        >
          <div className="text-16 mr-[6px] opacity-90">
            {object.Extra.voted ? (
              <RiThumbUpFill className="text-black opacity-60" />
            ) : (
              <RiThumbUpLine />
            )}
          </div>
          {object.Extra.upVoteCount ? (
            <span className="mr-1">{object.Extra.upVoteCount}</span>
          ) : (
            '赞'
          )}
        </div>
      </div>
      {state.showComment && (
        <Fade in={true} timeout={500}>
          <div className="mt-2 pb-2 border-t border-gray-f2">
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

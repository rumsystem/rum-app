import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
// import useAvatar from 'hooks/useAvatar';
import ProfileEditorModal from './ProfileEditorModal';

interface IProps {
  userId: string;
}

export default observer((props: IProps) => {
  const { activeGroupStore, nodeStore } = useStore();
  // const avatarUrl = useAvatar(props.userId);
  const avatarUrl = '';
  const isMe = nodeStore.info.node_publickey === props.userId;
  const state = useLocalObservable(() => ({
    showProfileEditorModal: false,
  }));

  return (
    <div className="relative profile py-5 rounded-12 bg-white border border-gray-88">
      <div className="flex justify-between items-center px-10 text-black">
        <div className="flex items-end">
          <img
            className="rounded-full bg-white border-shadow ml-1"
            src={avatarUrl}
            alt="cover"
            width="66"
            height="66"
          />
          <div className="ml-5">
            <div className="font-bold text-18 leading-none text-gray-4a">
              {props.userId.slice(-10, -2)}
            </div>
            <div className="mt-10-px text-14 flex items-center text-gray-9b pb-1">
              <span>
                <span className="text-14 font-bold">
                  {activeGroupStore.countMap[props.userId] || 0}
                </span>{' '}
                条内容
              </span>
              <span className="opacity-70 mx-2">·</span>
              <span>
                <span className="text-14 font-bold">2</span> 人关注
              </span>
            </div>
          </div>
        </div>
        <div className="mr-2">
          {isMe && (
            <div>
              <Button
                outline
                className="opacity-60"
                onClick={() => {
                  state.showProfileEditorModal = true;
                }}
              >
                编辑资料
              </Button>
              <ProfileEditorModal
                open={state.showProfileEditorModal}
                onClose={() => {
                  state.showProfileEditorModal = false;
                }}
              />
            </div>
          )}
          {!isMe && (
            <div>
              {activeGroupStore.followingSet.has(props.userId) ? (
                <Button
                  size="small"
                  outline
                  onClick={() => {
                    activeGroupStore.deleteFollowing(props.userId);
                  }}
                >
                  正在关注
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={() => {
                    activeGroupStore.addFollowing(props.userId);
                  }}
                >
                  关注
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
      `}</style>
    </div>
  );
});

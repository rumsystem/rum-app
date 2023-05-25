import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { GoChevronRight } from 'react-icons/go';
import { useStore } from 'store';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { NotificationModel, PostModel } from 'hooks/useDatabase/models';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { Avatar, Images } from 'components';
import { ago, lang, replaceSeedAsButton } from 'utils';
import { ForwardPost } from 'layouts/Main/Timeline/ForwardPost';

export const ForwardMessages = observer(() => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));
  const { notificationStore, modalStore } = useStore();
  const { notifications } = notificationStore;
  const activeGroup = useActiveGroup();
  const commentBoxs: Array<HTMLDivElement | null> = [];

  React.useEffect(action(() => {
    commentBoxs.forEach((v) => {
      if (v) { replaceSeedAsButton(v); }
    });
    state.loading = false;
  }));

  return (
    <div className={classNames(state.loading && 'opacity-0')}>
      {notifications.map((notification, index) => {
        const post = notification.object as PostModel.IDBPost | null;
        if (!post) { return lang.notFound(lang.object); }
        const { fromUser } = notification;
        const showLastReadFlag = index < notifications.length - 1
          && notifications[index + 1].Status === NotificationModel.NotificationStatus.read
          && notification.Status === NotificationModel.NotificationStatus.unread;
        return (
          <div key={notification.Id}>
            <div
              className={classNames(
                'p-2 pt-6 border-b border-gray-ec',
                showLastReadFlag && 'pb-2',
                !showLastReadFlag && 'pb-[18px]',
              )}
            >
              <div className="relative">
                <Avatar
                  className="absolute top-[-5px] left-0"
                  avatar={fromUser.avatar}
                  size={40}
                />
                <div className="pl-10 ml-3 text-13">
                  <div className="flex items-center leading-none">
                    <div className="text-gray-4a font-bold">
                      {fromUser.name}
                    </div>
                    <div className="ml-2 text-gray-9b text-12">
                      {lang.fowardYourPost}
                    </div>
                  </div>
                  <div
                    className="mt-[9px] opacity-90 break-all"
                    ref={(ref) => { commentBoxs[index] = ref; }}
                  >
                    {post.content}
                    {!post.content && !!post.images?.length && <Images images={post.images || []} />}
                  </div>
                  <ForwardPost className="mt-2" postId={post.forwardPostId} groupId={post.groupId} compact />
                  <div className="pt-3 mt-[2px] text-12 flex items-center text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(post.timestamp)}
                    </div>
                    <div
                      className="mr-3 cursor-pointer hover:text-black hover:font-bold flex items-center opacity-90"
                      onClick={() => {
                        if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
                          modalStore.objectDetail.show({
                            postId: post.id,
                          });
                        }
                      }}
                    >
                      {lang.open}
                      <GoChevronRight className="text-12 opacity-70 ml-[-1px]" />
                    </div>
                  </div>
                </div>
              </div>
              {showLastReadFlag && (
                <div className="w-full text-12 text-center pt-10 text-gray-400 ">
                  {lang.lastReadHere}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import Avatar from 'components/Avatar';
import { GoChevronRight } from 'react-icons/go';
import Images from 'components/Images';
import ago from 'utils/ago';

export default observer(() => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));
  const { notificationStore, modalStore } = useStore();
  const { notifications } = notificationStore;
  const activeGroup = useActiveGroup();
  const commentBoxs: Array<HTMLDivElement | null> = [];

  React.useEffect(action(() => {
    commentBoxs.forEach((v) => {
      if (v) {
        replaceSeedAsButton(v);
      }
    });
    state.loading = false;
  }));

  return (
    <div className={classNames(state.loading && 'opacity-0')}>
      {notifications.map((notification, index: number) => {
        const comment = notification.object as CommentModel.IDbDerivedCommentItem | null;

        if (!comment) {
          return lang.notFound(lang.comment);
        }

        const { fromUser } = notification;
        const showLastReadFlag = index < notifications.length - 1
          && notifications[index + 1].Status
            === NotificationModel.NotificationStatus.read
          && notification.Status === NotificationModel.NotificationStatus.unread;
        return (
          <div key={notification.Id}>
            <div
              className={classNames(
                {
                  'pb-2': showLastReadFlag,
                  'pb-[18px]': !showLastReadFlag,
                },
                'p-2 pt-6 border-b border-gray-ec',
              )}
            >
              <div className="relative">
                <Avatar
                  className="absolute top-[-5px] left-0"
                  url={fromUser.profile.avatar}
                  size={40}
                />
                <div className="pl-10 ml-3 text-13">
                  <div className="flex items-center leading-none">
                    <div className="text-gray-4a font-bold">
                      {fromUser.profile.name}
                    </div>
                    <div className="ml-2 text-gray-9b text-12">
                      {comment.Content.threadTrxId || comment.Content.replyTrxId
                        ? lang.replyYourComment
                        : lang.replyYourContent}
                    </div>
                  </div>
                  <div
                    className="mt-[9px] opacity-90 break-all"
                    ref={(ref) => { commentBoxs[index] = ref; }}
                  >
                    {comment.Content.content}
                    {!comment.Content.content && comment.Content.image && <Images images={comment.Content.image || []} />}
                  </div>
                  <div className="pt-3 mt-[2px] text-12 flex items-center text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(comment.TimeStamp)}
                    </div>
                    <div
                      className="mr-3 cursor-pointer hover:text-black hover:font-bold flex items-center opacity-90"
                      onClick={() => {
                        if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
                          modalStore.objectDetail.show({
                            objectTrxId: comment.Content.objectTrxId,
                            selectedCommentOptions: {
                              comment,
                              scrollBlock: 'center',
                            },
                          });
                        } else if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.POST) {
                          modalStore.forumObjectDetail.show({
                            objectTrxId: comment.Content.objectTrxId,
                            selectedCommentOptions: {
                              comment,
                              scrollBlock: 'center',
                            },
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

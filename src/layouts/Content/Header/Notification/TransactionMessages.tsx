import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import { GoChevronRight } from 'react-icons/go';
import ago from 'utils/ago';

interface IMessagesProps {
  openObject: (notification: NotificationModel.IDbDerivedNotification) => void
}

export default observer((props: IMessagesProps) => {
  const { notificationStore } = useStore();
  const { notifications } = notificationStore;

  return (
    <div>
      {notifications.map((notification, index: number) => {
        const object = notification.object as
          | CommentModel.IDbDerivedCommentItem
          | ObjectModel.IDbDerivedObjectItem;

        if (!object) {
          return lang.notFound(lang.object);
        }
        const { fromUser } = notification;
        const isObject = notification.Type === NotificationModel.NotificationType.objectTransaction;
        const isComment = notification.Type === NotificationModel.NotificationType.commentTransaction;
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
                  </div>
                  <div className="mt-[9px] opacity-90">
                    {isObject && '内容'}
                    {isComment && '评论'}
                    收到打赏 {notification.Extra?.memo || ''}
                  </div>
                  <div className="pt-3 mt-[2px] text-12 flex items-center text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(notification.TimeStamp)}
                    </div>
                    <div
                      className="mr-3 cursor-pointer hover:text-black hover:font-bold flex items-center opacity-90"
                      onClick={() => {
                        props.openObject(notification);
                      }}
                    >
                      {lang.open}
                      <GoChevronRight className="text-12 opacity-70 ml-[-1px]" />
                    </div>
                  </div>
                </div>
              </div>
              {showLastReadFlag && (
                <div className="w-full text-12 text-center pt-10 text-gray-400">
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

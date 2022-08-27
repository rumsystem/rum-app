import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import { GoChevronRight } from 'react-icons/go';
import Images from 'components/Images';
import ago from 'utils/ago';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

interface IMessagesProps {
  openObject: (notification: NotificationModel.IDbDerivedNotification) => void
}

export default observer((props: IMessagesProps) => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));
  const { notificationStore } = useStore();
  const { notifications } = notificationStore;
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
    <div>
      {notifications.map((notification, index: number) => {
        const object = notification.object as
          | CommentModel.IDbDerivedCommentItem
          | ObjectModel.IDbDerivedObjectItem;

        if (!object) {
          return lang.notFound(lang.object);
        }
        const { fromUser } = notification;
        const isObject = notification.Type === NotificationModel.NotificationType.objectLike;
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
                      {lang.likeFor(isObject ? lang.object : lang.comment)}
                    </div>
                  </div>
                  <div
                    className="mt-3 border-l-[3px] border-gray-9b pl-[9px] text-12 text-gray-4a"
                  >
                    {isObject && (object as ObjectModel.IDbDerivedObjectItem).Content.name && (
                      <div className="font-bold mb-1 text-gray-1b text-13">
                        {(object as ObjectModel.IDbDerivedObjectItem).Content.name}
                      </div>
                    )}
                    <div
                      className="inline-block like-messages-content"
                      ref={(ref) => { commentBoxs[index] = ref; }}
                    >
                      {object.Content.content || ''}
                    </div>
                    {!object.Content.content && object.Content.image && (<Images images={object.Content.image || []} />)}
                  </div>
                  <div className="pt-3 mt-[5px] text-12 flex items-center text-gray-af leading-none">
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
      <style jsx>{`
        .like-messages-content {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
      `}</style>
    </div>
  );
});

import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Avatar from 'components/Avatar';
import { useStore } from 'store';
import Badge from '@material-ui/core/Badge';
import useDatabase from 'hooks/useDatabase';
import Loading from 'components/Loading';
import BottomLine from 'components/BottomLine';
import ago from 'utils/ago';
import sleep from 'utils/sleep';
import classNames from 'classnames';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { GoChevronRight } from 'react-icons/go';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { lang } from 'utils/lang';
import openProducerModal from 'standaloneModals/openProducerModal';

interface IProps {
  open: boolean
  onClose: () => void
}

interface ITab {
  unreadCount: number
  text: string
}

const TabLabel = (tab: ITab) => (
  <div className="relative">
    <div className="absolute top-0 right-0 -mt-2 -mr-2">
      <Badge
        badgeContent={tab.unreadCount}
        className="transform scale-75 cursor-pointer"
        color="error"
      />
    </div>
    {tab.text}
  </div>
);

const LIMIT = 10;

const Notification = observer(() => {
  const database = useDatabase();
  const { notificationStore, activeGroupStore, latestStatusStore } = useStore();
  const { notifications } = notificationStore;
  const { notificationUnreadCountMap: unreadCountMap } = useActiveGroupLatestStatus();
  const state = useLocalObservable(() => ({
    tab: 0,
    isFetched: false,
    loading: false,
    page: 1,
    loadingMore: false,
    hasMore: true,
  }));
  const tabs = [
    {
      unreadCount:
        unreadCountMap.notificationUnreadCommentLike || 0
        + unreadCountMap.notificationUnreadObjectLike || 0,
      text: lang.like,
    },
    {
      unreadCount: unreadCountMap.notificationUnreadCommentObject || 0,
      text: lang.comment,
    },
    {
      unreadCount: unreadCountMap.notificationUnreadCommentReply || 0,
      text: lang.reply,
    },
    {
      unreadCount: unreadCountMap.notificationUnreadOther || 0,
      text: lang.others,
    },
  ] as ITab[];

  const markAllAsRead = async () => {
    await NotificationModel.markAllAsRead(database, activeGroupStore.id);
    const unreadCountMap = await NotificationModel.getUnreadCountMap(
      database,
      {
        GroupId: activeGroupStore.id,
      },
    );
    latestStatusStore.updateMap(database, activeGroupStore.id, {
      notificationUnreadCountMap: unreadCountMap,
    });
  };

  React.useEffect(() => {
    if (state.loading) {
      return;
    }
    state.loading = true;
    (async () => {
      try {
        let types = [] as NotificationModel.NotificationType[];
        if (state.tab === 0) {
          types = [
            NotificationModel.NotificationType.commentLike,
            NotificationModel.NotificationType.objectLike,
          ];
        } else if (state.tab === 1) {
          types = [NotificationModel.NotificationType.commentObject];
        } else if (state.tab === 2) {
          types = [NotificationModel.NotificationType.commentReply];
        } else if (state.tab === 3) {
          types = [NotificationModel.NotificationType.other];
        }
        const notifications = await NotificationModel.list(database, {
          GroupId: activeGroupStore.id,
          Types: types,
          offset: (state.page - 1) * LIMIT,
          limit: LIMIT,
        });
        await sleep(300);
        notificationStore.addNotifications(notifications);
        const unreadNotifications = notifications.filter(
          (notification) =>
            notification.Status === NotificationModel.NotificationStatus.unread,
        );
        if (unreadNotifications.length > 0) {
          for (const notification of unreadNotifications) {
            await NotificationModel.markAsRead(database, notification.Id || '');
          }
          const unreadCountMap = await NotificationModel.getUnreadCountMap(
            database,
            {
              GroupId: activeGroupStore.id,
            },
          );
          latestStatusStore.updateMap(database, activeGroupStore.id, {
            notificationUnreadCountMap: unreadCountMap,
          });
        }
        if (notifications.length < LIMIT) {
          state.hasMore = false;
        }
      } catch (err) {
        console.error(err);
      }
      state.loading = false;
      state.isFetched = true;
    })();
  }, [state.tab, state.page]);

  React.useEffect(() => () => {
    notificationStore.clear();
  }, []);

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.loading,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 200px 0px',
    onLoadMore: () => {
      if (state.loading) {
        return;
      }
      state.page += 1;
    },
  });

  return (
    <div className="h-[80vh] w-[550px] flex flex-col bg-white rounded-0">
      <Tabs
        className="px-8 relative bg-white z-10 with-border flex-none mt-2"
        value={state.tab}
        onChange={(_e, newTab) => {
          if (state.loading || state.tab === newTab) {
            return;
          }
          state.isFetched = false;
          state.hasMore = true;
          state.tab = newTab;
          state.page = 1;
          notificationStore.clear();
        }}
      >
        {tabs.map((_tab, idx: number) => <Tab key={idx} label={TabLabel(_tab)} />)}
        <div className="flex-grow flex items-center flex-row-reverse">
          <div
            className="text-13 font-bold text-link-blue cursor-pointer"
            onClick={markAllAsRead}
          >{lang.allHaveReaded}</div>
        </div>
      </Tabs>
      <div className="flex-1 h-0 overflow-y-auto px-8" ref={rootRef}>
        {!state.isFetched && (
          <div className="pt-32">
            <Loading />
          </div>
        )}
        {state.isFetched && (
          <div className="py-4">
            {state.tab === 0 && <LikeMessages />}
            {state.tab === 1 && <CommentMessages />}
            {state.tab === 2 && <CommentMessages />}
            {state.tab === 3 && <OtherMessages />}
            {notifications.length === 0 && (
              <div className="py-28 text-center text-14 text-gray-400 opacity-80">
                {lang.empty(lang.message)}
              </div>
            )}
          </div>
        )}
        {notifications.length > 5 && !state.hasMore && <BottomLine />}
        <div ref={sentryRef} />
      </div>
    </div>
  );
});

const CommentMessages = observer(() => {
  const { notificationStore, modalStore } = useStore();
  const { notifications } = notificationStore;
  const activeGroup = useActiveGroup();

  return (
    <div>
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
                  <div className="mt-[9px] opacity-90 break-all">
                    {comment.Content.content}
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

const OtherMessages = observer(() => {
  const { notificationStore } = useStore();
  const { notifications } = notificationStore;

  return (
    <div>
      {notifications.map((notification, index: number) => {
        const { fromUser } = notification;

        if (!fromUser) {
          return lang.notFound('fromUser');
        }

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
                    {notification.Extra?.type === NotificationModel.NotificationExtraType.producerAdd
                        && lang.addProducerFeedback}
                    {notification.Extra?.type === NotificationModel.NotificationExtraType.producerRemove
                        && lang.removeProducerFeedback}
                  </div>
                  <div className="pt-3 mt-[2px] text-12 flex items-center text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(notification.TimeStamp)}
                    </div>
                    <div
                      className="mr-3 cursor-pointer hover:text-black hover:font-bold flex items-center opacity-90"
                      onClick={() => {
                        if (notification.Extra?.type === NotificationModel.NotificationExtraType.producerAdd || notification.Extra?.type === NotificationModel.NotificationExtraType.producerRemove) {
                          openProducerModal();
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

const LikeMessages = observer(() => {
  const { notificationStore, modalStore } = useStore();
  const { notifications } = notificationStore;
  const activeGroup = useActiveGroup();

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
        const isComment = notification.Type === NotificationModel.NotificationType.commentLike;
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
                  <div className="mt-3 border-l-[3px] border-gray-9b pl-[9px] text-12 text-gray-4a">
                    {isObject && (object as ObjectModel.IDbDerivedObjectItem).Content.name && (
                      <div className="font-bold mb-1 text-gray-1b text-13">
                        {(object as ObjectModel.IDbDerivedObjectItem).Content.name}
                      </div>
                    )}
                    {object.Content.content.slice(0, 120)}
                  </div>
                  <div className="pt-3 mt-[5px] text-12 flex items-center text-gray-af leading-none">
                    <div className="mr-6 opacity-90">
                      {ago(notification.TimeStamp)}
                    </div>
                    <div
                      className="mr-3 cursor-pointer hover:text-black hover:font-bold flex items-center opacity-90"
                      onClick={() => {
                        if (isObject) {
                          if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
                            modalStore.objectDetail.show({
                              objectTrxId: object.TrxId,
                            });
                          } else if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.POST) {
                            modalStore.forumObjectDetail.show({
                              objectTrxId: object.TrxId,
                            });
                          }
                        } else {
                          modalStore.objectDetail.show({
                            objectTrxId: (
                              object as CommentModel.IDbDerivedCommentItem
                            ).Content.objectTrxId,
                            selectedCommentOptions: {
                              comment:
                                object as CommentModel.IDbDerivedCommentItem,
                              scrollBlock: 'center',
                            },
                          });
                        }
                        if (isComment) {
                          const comment = object as CommentModel.IDbDerivedCommentItem;
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

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <Notification />
  </Dialog>
));

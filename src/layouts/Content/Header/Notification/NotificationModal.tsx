import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useStore } from 'store';
import Badge from '@material-ui/core/Badge';
import useDatabase from 'hooks/useDatabase';
import Loading from 'components/Loading';
import BottomLine from 'components/BottomLine';
import sleep from 'utils/sleep';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { lang } from 'utils/lang';
import CommentMessages from './CommentMessages';
import LikeMessages from './LikeMessages';
import TransactionMessages from './TransactionMessages';
import OtherMessages from './OtherMessages';

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
        className="scale-75 cursor-pointer"
        color="error"
      />
    </div>
    {tab.text}
  </div>
);

const LIMIT = 10;

const Notification = observer(() => {
  const database = useDatabase();
  const activeGroup = useActiveGroup();
  const { notificationStore, activeGroupStore, latestStatusStore, modalStore } = useStore();
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
      unreadCount:
        unreadCountMap.notificationUnreadObjectTransaction || 0
        + unreadCountMap.notificationUnreadCommentTransaction || 0,
      text: lang.transaction,
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
    latestStatusStore.update(activeGroupStore.id, {
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
          types = [
            NotificationModel.NotificationType.objectTransaction,
            NotificationModel.NotificationType.commentTransaction,
          ];
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
          latestStatusStore.update(activeGroupStore.id, {
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

  const openObject = (notification: NotificationModel.IDbDerivedNotification) => {
    const isObject = notification.Type.includes('object');
    const isComment = notification.Type.includes('comment');
    const object = notification.object as
          | CommentModel.IDbDerivedCommentItem
          | ObjectModel.IDbDerivedObjectItem;
    if (!object) {
      console.log(lang.notFound(lang.object)); return;
    }
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
  };

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
        <div className="grow flex items-center flex-row-reverse">
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
            {state.tab === 0 && <LikeMessages openObject={openObject} />}
            {state.tab === 1 && <CommentMessages />}
            {state.tab === 2 && <CommentMessages />}
            {state.tab === 3 && <TransactionMessages openObject={openObject} />}
            {state.tab === 4 && <OtherMessages />}
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

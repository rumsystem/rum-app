import type Database from 'hooks/useDatabase/database';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as ProfileModel from 'hooks/useDatabase/models/profile';

export enum NotificationType {
  objectLike = 'objectLike',
  commentLike = 'commentLike',
  commentPost = 'commentPost',
  commentReply = 'commentReply',
  objectTransaction = 'objectTransaction',
  commentTransaction = 'commentTransaction',
}

export enum NotificationStatus {
  read = 'read',
  unread = 'unread',
}

export interface IDBNotificationRaw {
  Id?: string
  GroupId: string
  ObjectId: string
  fromPublisher: string
  Type: NotificationType
  Status: NotificationStatus
  TimeStamp: number
  Extra?: {
    type?: NotificationExtraType
    memo?: string
  }
}

export enum NotificationExtraType {
  producerAdd = 'producerAdd',
  producerRemove = 'producerRemove',
}

export interface IDBNotification extends IDBNotificationRaw {
  object: unknown
  fromUser: ProfileModel.IDBProfile
}

export const add = async (db: Database, notification: Omit<IDBNotificationRaw, 'Id'>) => {
  await db.notifications.add(notification);
  // await syncSummary(db, notification);
};
export const bullAdd = async (db: Database, notifications: Array<Omit<IDBNotificationRaw, 'Id'>>) => {
  await db.notifications.bulkAdd(notifications);
  // await syncSummary(db, notification);
};

export const markAsRead = async (db: Database, Id: string) => {
  await db.notifications
    .where({ Id })
    .modify({ Status: NotificationStatus.read });
  // const notification = await db.notifications.get({
  //   Id,
  // });
  // if (notification) {
  //   await syncSummary(db, notification);
  // }
};

export const markAllAsRead = async (db: Database, GroupId: string) => {
  await db.notifications
    .where({ GroupId, Status: NotificationStatus.unread })
    .modify({ Status: NotificationStatus.read });
  // await resetSummary(db, GroupId);
};

// const syncSummary = async (db: Database, notification: Omit<IDbNotification, 'Id'>) => {
//   let ObjectType = '' as SummaryObjectType;
//   if (notification.Type === NotificationType.objectLike) {
//     ObjectType = SummaryObjectType.notificationUnreadObjectLike;
//   } else if (notification.Type === NotificationType.commentLike) {
//     ObjectType = SummaryObjectType.notificationUnreadCommentLike;
//   } else if (notification.Type === NotificationType.commentPost) {
//     ObjectType = SummaryObjectType.notificationUnreadCommentPost;
//   } else if (notification.Type === NotificationType.commentReply) {
//     ObjectType = SummaryObjectType.notificationUnreadCommentReply;
//   } else if (notification.Type === NotificationType.objectTransaction) {
//     ObjectType = SummaryObjectType.notificationUnreadObjectTransaction;
//   } else if (notification.Type === NotificationType.commentTransaction) {
//     ObjectType = SummaryObjectType.notificationUnreadCommentTransaction;
//   }
//   const count = await db.notifications
//     .where({
//       GroupId: notification.GroupId,
//       Type: notification.Type,
//       Status: NotificationStatus.unread,
//     })
//     .count();
//   await SummaryModel.createOrUpdate(db, {
//     GroupId: notification.GroupId,
//     ObjectId: '',
//     ObjectType,
//     Count: count,
//   });
// };

// const resetSummary = async (
//   db: Database,
//   GroupId: string,
// ) => {
//   for (const ObjectType of Object.values(SummaryObjectType)) {
//     await SummaryModel.createOrUpdate(db, {
//       GroupId,
//       ObjectId: '',
//       ObjectType: ObjectType as SummaryObjectType,
//       Count: 0,
//     });
//   }
// };

export interface IUnreadCountMap {
  [NotificationType.objectLike]: number
  [NotificationType.commentLike]: number
  [NotificationType.commentPost]: number
  [NotificationType.commentReply]: number
  [NotificationType.objectTransaction]: number
  [NotificationType.commentTransaction]: number
}

export const getUnreadCountMap = async (db: Database, options: { GroupId: string }) => {
  const { GroupId } = options;
  const notificationsTypes = [
    NotificationType.objectLike,
    NotificationType.commentLike,
    NotificationType.commentPost,
    NotificationType.commentReply,
    NotificationType.objectTransaction,
    NotificationType.commentTransaction,
  ] as const;
  const map: IUnreadCountMap = {
    [NotificationType.objectLike]: 0,
    [NotificationType.commentLike]: 0,
    [NotificationType.commentPost]: 0,
    [NotificationType.commentReply]: 0,
    [NotificationType.objectTransaction]: 0,
    [NotificationType.commentTransaction]: 0,
  };
  const unreadNotifications = await db.notifications.where({
    GroupId,
    Status: NotificationStatus.unread,
  }).toArray();

  unreadNotifications.forEach((v) => {
    const item = notificationsTypes.find((u) => u === v.Type);
    if (item) {
      map[item] += 1;
    }
  });

  return map;
};

export const list = async (
  db: Database,
  options: {
    GroupId: string
    Types: NotificationType[]
    limit: number
    offset?: number
  },
) => {
  const notifications = await db.notifications
    .where('[GroupId+Type]')
    .anyOf(options.Types.map((v) => [options.GroupId, v]))
    // .where({
    //   GroupId: options.GroupId,
    // })
    // .filter((notification) => options.Types.includes(notification.Type))
    .reverse()
    .offset(options.offset || 0)
    .limit(options.limit)
    .toArray();

  if (notifications.length === 0) {
    return [];
  }

  const result = await Promise.all(
    notifications.map((notification) => packNotification(db, notification)),
  );

  return result;
};

const packNotification = async (
  db: Database,
  notification: IDBNotificationRaw,
) => {
  let object = null as any;
  const isPost = [
    NotificationType.objectLike,
    NotificationType.objectTransaction,
  ].includes(notification.Type);
  const isComment = [
    NotificationType.commentLike,
    NotificationType.commentPost,
    NotificationType.commentReply,
    NotificationType.commentTransaction,
  ].includes(notification.Type);
  if (isPost) {
    object = await PostModel.get(db, {
      groupId: notification.GroupId,
      id: notification.ObjectId,
      raw: true,
    });
  } else if (isComment) {
    object = await CommentModel.get(db, {
      groupId: notification.GroupId,
      id: notification.ObjectId,
      raw: true,
    });
  }
  const fromUser = await ProfileModel.get(db, {
    groupId: notification.GroupId,
    publisher: notification.fromPublisher || '',
    useFallback: true,
  });
  const item: IDBNotification = {
    ...notification,
    object,
    fromUser,
  };
  return item;
};

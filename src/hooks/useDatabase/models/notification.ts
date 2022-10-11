import Database from 'hooks/useDatabase/database';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { SummaryObjectType } from 'hooks/useDatabase/models/summary';
import * as SummaryModel from 'hooks/useDatabase/models/summary';
import * as PersonModel from 'hooks/useDatabase/models/person';

export enum NotificationType {
  objectLike = 'objectLike',
  commentLike = 'commentLike',
  commentObject = 'commentObject',
  commentReply = 'commentReply',
  objectTransaction = 'objectTransaction',
  commentTransaction = 'commentTransaction',
}

export enum NotificationStatus {
  read = 'read',
  unread = 'unread',
}

export interface IDbNotification extends IDbNotificationPayload {
  Id?: string
}

export enum NotificationExtraType {
  producerAdd = 'producerAdd',
  producerRemove = 'producerRemove',
}

export interface IDbNotificationPayload {
  GroupId: string
  ObjectTrxId: string
  fromPublisher: string
  Type: NotificationType
  Status: NotificationStatus
  TimeStamp: number
  Extra?: {
    type?: NotificationExtraType
    memo?: string
  }
}

export interface IDbDerivedNotification extends IDbNotification {
  object: any
  fromUser: PersonModel.IUser
}

export const create = async (
  db: Database,
  notification: IDbNotificationPayload,
) => {
  await db.notifications.add(notification);
  await syncSummary(db, notification);
};

export const markAsRead = async (db: Database, Id: string) => {
  await db.notifications
    .where({
      Id,
    })
    .modify({
      Status: NotificationStatus.read,
    });
  const notification = await db.notifications.get({
    Id,
  });
  if (notification) {
    await syncSummary(db, notification);
  }
};

export const markAllAsRead = async (db: Database, GroupId: string) => {
  await db.notifications
    .where({
      GroupId,
      Status: NotificationStatus.unread,
    })
    .modify({
      Status: NotificationStatus.read,
    });
  await resetSummary(db, GroupId);
};

const syncSummary = async (
  db: Database,
  notification: IDbNotificationPayload,
) => {
  let ObjectType = '' as SummaryObjectType;
  if (notification.Type === NotificationType.objectLike) {
    ObjectType = SummaryObjectType.notificationUnreadObjectLike;
  } else if (notification.Type === NotificationType.commentLike) {
    ObjectType = SummaryObjectType.notificationUnreadCommentLike;
  } else if (notification.Type === NotificationType.commentObject) {
    ObjectType = SummaryObjectType.notificationUnreadCommentObject;
  } else if (notification.Type === NotificationType.commentReply) {
    ObjectType = SummaryObjectType.notificationUnreadCommentReply;
  } else if (notification.Type === NotificationType.objectTransaction) {
    ObjectType = SummaryObjectType.notificationUnreadObjectTransaction;
  } else if (notification.Type === NotificationType.commentTransaction) {
    ObjectType = SummaryObjectType.notificationUnreadCommentTransaction;
  }
  const count = await db.notifications
    .where({
      GroupId: notification.GroupId,
      Type: notification.Type,
      Status: NotificationStatus.unread,
    })
    .count();
  await SummaryModel.createOrUpdate(db, {
    GroupId: notification.GroupId,
    ObjectId: '',
    ObjectType,
    Count: count,
  });
};

const resetSummary = async (
  db: Database,
  GroupId: string,
) => {
  for (const ObjectType of Object.values(SummaryObjectType)) {
    await SummaryModel.createOrUpdate(db, {
      GroupId,
      ObjectId: '',
      ObjectType: ObjectType as SummaryObjectType,
      Count: 0,
    });
  }
};

export interface IUnreadCountMap {
  [SummaryObjectType.notificationUnreadObjectLike]: number
  [SummaryObjectType.notificationUnreadCommentLike]: number
  [SummaryObjectType.notificationUnreadCommentObject]: number
  [SummaryObjectType.notificationUnreadCommentReply]: number
  [SummaryObjectType.notificationUnreadObjectTransaction]: number
  [SummaryObjectType.notificationUnreadCommentTransaction]: number
}

export const getUnreadCountMap = async (
  db: Database,
  options: {
    GroupId: string
  },
) => {
  const summaries = await Promise.all([
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadObjectLike,
    }),
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadCommentLike,
    }),
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadCommentObject,
    }),
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadCommentReply,
    }),
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadObjectTransaction,
    }),
    SummaryModel.getCount(db, {
      GroupId: options.GroupId,
      ObjectType: SummaryObjectType.notificationUnreadCommentTransaction,
    }),
  ]);
  return {
    [SummaryObjectType.notificationUnreadObjectLike]: summaries[0],
    [SummaryObjectType.notificationUnreadCommentLike]: summaries[1],
    [SummaryObjectType.notificationUnreadCommentObject]: summaries[2],
    [SummaryObjectType.notificationUnreadCommentReply]: summaries[3],
    [SummaryObjectType.notificationUnreadObjectTransaction]: summaries[4],
    [SummaryObjectType.notificationUnreadCommentTransaction]: summaries[5],
  } as IUnreadCountMap;
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
    .where({
      GroupId: options.GroupId,
    })
    .filter((notification) => options.Types.includes(notification.Type))
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
  notification: IDbNotification,
) => {
  let object = null as any;
  if (
    [
      NotificationType.objectLike,
      NotificationType.objectTransaction,
    ].includes(notification.Type)
  ) {
    object = await ObjectModel.get(db, {
      TrxId: notification.ObjectTrxId,
      raw: true,
    });
  } else if (
    [
      NotificationType.commentLike,
      NotificationType.commentObject,
      NotificationType.commentReply,
      NotificationType.commentTransaction,
    ].includes(notification.Type)
  ) {
    object = await CommentModel.get(db, {
      TrxId: notification.ObjectTrxId,
      raw: true,
    });
  }
  const fromUser = await PersonModel.getUser(db, {
    GroupId: notification.GroupId,
    Publisher: notification.fromPublisher || '',
  });
  return {
    ...notification,
    object,
    fromUser,
  } as IDbDerivedNotification;
};

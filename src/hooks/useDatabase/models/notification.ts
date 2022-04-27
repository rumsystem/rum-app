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
  other = 'other',
}

export enum NotificationStatus {
  read = 'read',
  unread = 'unread',
}

export interface IDbNotification extends IDbNotificationPayload {
  Id?: string
  TimeStamp: number
}

export enum NotificationExtraType {
  producerApproved = 'producerApproved',
}

export interface IDbNotificationPayload {
  GroupId: string
  ObjectTrxId: string
  Type: NotificationType
  Status: NotificationStatus
  Extra?: {
    fromPubKey: string
    type: NotificationExtraType
  }
}

export interface IDbDerivedNotification extends IDbNotification {
  object: any
}

export const create = async (
  db: Database,
  notification: IDbNotificationPayload,
) => {
  await db.notifications.add({
    ...notification,
    TimeStamp: Date.now() * 1000000,
  });
  await syncSummary(db, notification);
};

export const exists = async (
  db: Database,
  options: any,
) => {
  const notification = await db.notifications.get(options);
  return !!notification;
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
  } else if (notification.Type === NotificationType.other) {
    ObjectType = SummaryObjectType.notificationUnreadOther;
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

export interface IUnreadCountMap {
  [SummaryObjectType.notificationUnreadObjectLike]: number
  [SummaryObjectType.notificationUnreadCommentLike]: number
  [SummaryObjectType.notificationUnreadCommentObject]: number
  [SummaryObjectType.notificationUnreadCommentReply]: number
  [SummaryObjectType.notificationUnreadOther]: number
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
      ObjectType: SummaryObjectType.notificationUnreadOther,
    }),
  ]);
  return {
    [SummaryObjectType.notificationUnreadObjectLike]: summaries[0],
    [SummaryObjectType.notificationUnreadCommentLike]: summaries[1],
    [SummaryObjectType.notificationUnreadCommentObject]: summaries[2],
    [SummaryObjectType.notificationUnreadCommentReply]: summaries[3],
    [SummaryObjectType.notificationUnreadOther]: summaries[4],
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
  if (notification.Type === NotificationType.objectLike) {
    object = await ObjectModel.get(db, {
      TrxId: notification.ObjectTrxId,
    });
  } else if (
    [
      NotificationType.commentLike,
      NotificationType.commentObject,
      NotificationType.commentReply,
    ].includes(notification.Type)
  ) {
    object = await CommentModel.get(db, {
      TrxId: notification.ObjectTrxId,
    });
  } else if (notification.Type === NotificationType.other) {
    object = await PersonModel.getUser(db, {
      GroupId: notification.GroupId,
      Publisher: notification.Extra?.fromPubKey || '',
    });
  }
  return {
    ...notification,
    object,
  } as IDbDerivedNotification;
};

import Database from 'hooks/useDatabase/database';
import type * as NotificationModel from 'hooks/useDatabase/models/notification';

export interface ILatestStatus {
  latestTrxId: string
  latestTimeStamp: number
  latestObjectTimeStamp: number
  latestReadTimeStamp: number
  unreadCount: number
  notificationUnreadCountMap: NotificationModel.IUnreadCountMap
}

export interface ILatestStatusPayload {
  latestTrxId?: string
  latestTimeStamp?: number
  latestObjectTimeStamp?: number
  latestReadTimeStamp?: number
  unreadCount?: number
  notificationUnreadCountMap?: NotificationModel.IUnreadCountMap
}

export const DEFAULT_LATEST_STATUS = {
  latestTrxId: '',
  latestTimeStamp: 0,
  latestObjectTimeStamp: 0,
  latestReadTimeStamp: 0,
  unreadCount: 0,
  notificationUnreadCountMap: {} as NotificationModel.IUnreadCountMap,
};

export interface IDBLatestStatus {
  Id?: string
  GroupId: string
  Status: ILatestStatus
}

export type ILatestStatusMap = Record<string, ILatestStatus>;

export const createOrUpdate = async (db: Database, groupId: string, status: ILatestStatusPayload) => {
  const whereQuery = {
    GroupId: groupId,
  };
  const exist = await db.latestStatus.get(whereQuery);
  if (exist) {
    await db.latestStatus.where(whereQuery).modify({
      Status: {
        ...exist.Status,
        ...status,
      },
    });
  } else {
    await db.latestStatus.add({
      GroupId: groupId,
      Status: {
        ...DEFAULT_LATEST_STATUS,
        ...status,
      },
    });
  }
};

export const getLatestStatusMap = async (db: Database) => {
  const allLatestStatus = await db.latestStatus.toArray();
  const map = {} as ILatestStatusMap;
  for (const latestStatus of allLatestStatus) {
    map[latestStatus.GroupId] = latestStatus.Status;
  }
  return map;
};

export const remove = async (db: Database, groupId: string) => {
  await db.latestStatus.where({
    GroupId: groupId,
  }).delete();
};

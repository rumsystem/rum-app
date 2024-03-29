import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import type * as NotificationModel from 'hooks/useDatabase/models/notification';

const LATEST_STATUS_STORE_KEY = 'latestStatus';

export interface ILatestStatus {
  groupId: string
  latestTrxId: string
  latestPostTimeStamp: number
  latestReadTimeStamp: number
  lastUpdated: number
  unreadCount: number
  notificationUnreadCountMap: NotificationModel.IUnreadCountMap
  producerCount: number
  recentContentLogs: Array<string>
}

export interface ILatestStatusPayload {
  latestTrxId?: string
  latestPostTimeStamp?: number
  latestReadTimeStamp?: number
  lastUpdated?: number
  unreadCount?: number
  notificationUnreadCountMap?: NotificationModel.IUnreadCountMap
  producerCount?: number
  recentContentLogs?: Array<any>
}

const DEFAULT_LATEST_STATUS: ILatestStatus = {
  groupId: '',
  latestTrxId: '',
  latestPostTimeStamp: 0,
  latestReadTimeStamp: 0,
  lastUpdated: 0,
  unreadCount: 0,
  notificationUnreadCountMap: {} as NotificationModel.IUnreadCountMap,
  producerCount: 1,
  recentContentLogs: [],
};

export type ILatestStatusMap = Record<string, ILatestStatus>;

export function createLatestStatusStore() {
  return {
    DEFAULT_LATEST_STATUS,

    map: {} as ILatestStatusMap,

    getStore() {
      return ElectronCurrentNodeStore.getStore();
    },

    init() {
      const items = (this.getStore().get(LATEST_STATUS_STORE_KEY) || []) as ILatestStatus[];
      for (const item of items) {
        this.map[item.groupId] = item;
      }
    },

    update(groupId: string, data: ILatestStatusPayload) {
      this.map[groupId] = {
        ...this.map[groupId] || this.DEFAULT_LATEST_STATUS,
        ...data,
        groupId,
      };
      this.getStore().set(LATEST_STATUS_STORE_KEY, Object.values(this.map));
    },

    remove(groupId: string) {
      delete this.map[groupId];
      this.getStore().set(LATEST_STATUS_STORE_KEY, Object.values(this.map));
    },
  };
}

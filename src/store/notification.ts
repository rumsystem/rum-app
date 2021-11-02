import * as NotificationModel from 'hooks/useDatabase/models/notification';
import { runInAction } from 'mobx';

export function createNotificationStore() {
  return {
    unreadCountMap: {} as NotificationModel.IUnreadCountMap,

    idSet: new Set() as Set<string>,

    map: {} as { [id: string]: NotificationModel.IDbDerivedNotification },

    get notifications() {
      return Array.from(this.idSet).map((id) => this.map[id]);
    },

    addNotifications(
      notifications: NotificationModel.IDbDerivedNotification[]
    ) {
      runInAction(() => {
        for (const notification of notifications) {
          this.idSet.add(notification.Id || '');
          this.map[notification.Id || ''] = notification;
        }
      });
    },

    clear() {
      runInAction(() => {
        this.idSet.clear();
        this.map = {};
      });
    },
  };
}

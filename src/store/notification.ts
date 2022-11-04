import type * as NotificationModel from 'hooks/useDatabase/models/notification';
import { runInAction } from 'mobx';

export function createNotificationStore() {
  return {
    idSet: new Set<string>(),

    map: {} as Record<string, NotificationModel.IDbDerivedNotification>,

    get notifications() {
      return Array.from(this.idSet).map((id) => this.map[id]);
    },

    addNotifications(
      notifications: NotificationModel.IDbDerivedNotification[],
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

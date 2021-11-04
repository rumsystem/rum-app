import Database from 'hooks/useDatabase/database';
import { Store } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';

export default (database: Database, store: Store) => {
  const { latestStatusStore } = store;

  return async (groupId: string) => {
    const unreadCountMap = await NotificationModel.getUnreadCountMap(
      database,
      {
        GroupId: groupId,
      },
    );
    await latestStatusStore.updateMap(database, groupId, {
      notificationUnreadCountMap: unreadCountMap,
    });
  };
};

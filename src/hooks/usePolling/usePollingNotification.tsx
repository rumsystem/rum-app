import React from 'react';
import { sleep } from 'utils';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useDatabase from 'hooks/useDatabase';
import { sum } from 'lodash';

export default (duration: number) => {
  const { groupStore, activeGroupStore, nodeStore, notificationStore } =
    useStore();
  const database = useDatabase();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        for (const group of groupStore.groups) {
          await fetchNotification(group.GroupId);
        }
        await sleep(duration);
      }
    })();

    async function fetchNotification(groupId: string) {
      try {
        const unreadCountMap = await NotificationModel.getUnreadCountMap(
          database,
          {
            GroupId: groupId,
          }
        );
        groupStore.updateLatestStatusMap(groupId, {
          notificationUnreadCountMap: unreadCountMap,
        });
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [activeGroupStore]);
};

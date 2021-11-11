import React from 'react';
import sleep from 'utils/sleep';
import GroupApi, { IGroup } from 'apis/group';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useDatabase from 'hooks/useDatabase';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';

export default (duration: number) => {
  const store = useStore();
  const { groupStore, nodeStore } = store;
  const database = useDatabase();
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1500);
      while (!stop && !nodeStore.quitting) {
        fetch();
        await sleep(duration);
      }
    })();

    async function fetch() {
      try {
        const groups = groupStore.notOwnGroups;
        for (let i = 0; i < groups.length;) {
          const start = i;
          const end = i + 3;
          await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchApprovedProducers(group)),
          );
          i = end;
          await sleep(100);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchApprovedProducers(group: IGroup) {
      const groupId = group.group_id;
      try {
        const producers = await GroupApi.fetchApprovedProducers(groupId);
        const producer = producers.find((producer) => producer.ProducerPubkey === group.user_pubkey);
        if (producer) {
          console.log('[producer]: get notification after own approved');
          const exists = await NotificationModel.exists(database, {
            GroupId: groupId,
            ObjectTrxId: group.user_pubkey,
            Type: NotificationModel.NotificationType.other,
          });
          if (!exists) {
            await NotificationModel.create(database, {
              GroupId: groupId,
              ObjectTrxId: group.user_pubkey,
              Type: NotificationModel.NotificationType.other,
              Status: NotificationModel.NotificationStatus.unread,
              Extra: {
                type: NotificationModel.NotificationExtraType.producerApproved,
                fromPubKey: producer.OwnerPubkey,
              },
            });
            syncNotificationUnreadCount(groupId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

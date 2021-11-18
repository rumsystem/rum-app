import React from 'react';
import sleep from 'utils/sleep';
import { IGroup } from 'apis/group';
import ProducerApi, { IApprovedProducer } from 'apis/producer';
import { useStore } from 'store';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useDatabase from 'hooks/useDatabase';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';

export default (duration: number) => {
  const store = useStore();
  const { groupStore, nodeStore, latestStatusStore } = store;
  const database = useDatabase();
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1500);
      while (!stop && !nodeStore.quitting) {
        await fetch();
        await sleep(duration);
      }
    })();

    async function fetch() {
      try {
        const { groups } = groupStore;
        for (let i = 0; i < groups.length;) {
          const start = i;
          const end = i + 3;
          await Promise.all(
            groups
              .slice(start, end)
              .map((group) => fetchForApprovedProducers(group)),
          );
          i = end;
          await sleep(100);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchForApprovedProducers(group: IGroup) {
      const groupId = group.group_id;
      try {
        const producers = await ProducerApi.fetchApprovedProducers(groupId) || [];
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        if (latestStatus.producerCount !== producers.length) {
          await latestStatusStore.updateMap(database, groupId, {
            producerCount: producers.length,
          });
        }
        const notOwner = group.owner_pubkey !== group.user_pubkey;
        if (notOwner) {
          handleApprovedProducerNotification(group, producers);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function handleApprovedProducerNotification(group: IGroup, producers: IApprovedProducer[]) {
      const groupId = group.group_id;
      try {
        const cacheKey = `${group.user_pubkey}_IS_PRODUCER`;
        const producer = producers.find((producer) => producer.ProducerPubkey === group.user_pubkey);
        const ObjectTrxId = producer ? `${producer.ProducerPubkey}_${producer.TimeStamp}` : '';
        const isProducer = localStorage.getItem(cacheKey);
        if ((!isProducer || isProducer === 'false') && producer) {
          console.log('[producer]: get notification after owner add');
          await NotificationModel.create(database, {
            GroupId: groupId,
            ObjectTrxId,
            Type: NotificationModel.NotificationType.other,
            Status: NotificationModel.NotificationStatus.unread,
            Extra: {
              type: NotificationModel.NotificationExtraType.producerAdd,
              fromPubKey: producer.OwnerPubkey,
            },
          });
          syncNotificationUnreadCount(groupId);
          localStorage.setItem(cacheKey, 'true');
        } else if (isProducer === 'true' && !producer) {
          console.log('[producer]: get notification after owner removed');
          await NotificationModel.create(database, {
            GroupId: groupId,
            ObjectTrxId,
            Type: NotificationModel.NotificationType.other,
            Status: NotificationModel.NotificationStatus.unread,
            Extra: {
              type: NotificationModel.NotificationExtraType.producerRemove,
              fromPubKey: producers[0].OwnerPubkey,
            },
          });
          syncNotificationUnreadCount(groupId);
          localStorage.setItem(cacheKey, 'false');
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

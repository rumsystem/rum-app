import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import MVMApi, { ITransaction } from 'apis/mvm';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import { addMilliseconds } from 'date-fns';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ObjectModel from 'hooks/useDatabase/models/object';

const LAST_SYNC_TRANSFER_TIMESTAMP_KEY = 'lastSyncTransactionTimestamp';

export default (duration: number) => {
  const store = useStore();
  const { nodeStore, groupStore, activeGroupStore, commentStore } = store;
  const database = useDatabase();
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await fetchTransferTransactions();
      }
    })();

    async function fetchTransferTransactions() {
      try {
        const lastSyncTimestamp = ElectronCurrentNodeStore.getStore().get(LAST_SYNC_TRANSFER_TIMESTAMP_KEY) as string;
        const res = await MVMApi.transactions(lastSyncTimestamp ? {
          timestamp: addMilliseconds(new Date(lastSyncTimestamp), 1).toISOString(),
          count: 100,
        } : {
          count: 100,
        });
        if ((res.data || []).length > 0) {
          ElectronCurrentNodeStore.getStore().set(LAST_SYNC_TRANSFER_TIMESTAMP_KEY, res.data[res.data.length - 1].timestamp);
        }
        const transfers = (res.data || []).filter((transfer) => transfer.type === 'TRANSFER');
        if (transfers.length === 0) {
          return;
        }
        await TransferModel.bulkCreate(database, transfers);
        await handleNotification(transfers);
        handleStore(transfers);
      } catch (err) {
        console.log(err);
      }
    }

    const handleNotification = async (transfers: ITransaction[]) => {
      const activeGroup = groupStore.map[activeGroupStore.id];
      if (activeGroup) {
        const receivedTransactions = transfers.filter((transfer) => transfer.to === activeGroup.user_eth_addr);
        for (const transaction of receivedTransactions) {
          const objectTrxId = transaction.uuid.split(' ')[0];
          if (!objectTrxId) {
            console.error(new Error(`objectTrxId not found from transaction ${transaction.uuid}`));
            return;
          }
          const [object, comment] = await Promise.all([
            ObjectModel.get(database, {
              TrxId: objectTrxId,
              raw: true,
            }),
            CommentModel.get(database, {
              TrxId: objectTrxId,
              raw: true,
            }),
          ]);
          if (!object && !comment) {
            return;
          }
          await NotificationModel.create(database, {
            GroupId: activeGroupStore.id,
            ObjectTrxId: objectTrxId || '',
            fromPublisher: activeGroup.user_pubkey,
            Type: object ? NotificationModel.NotificationType.objectTransaction : NotificationModel.NotificationType.commentTransaction,
            Status: NotificationModel.NotificationStatus.unread,
            TimeStamp: new Date().getTime() * 1000000,
            Extra: {
              memo: `${transaction.amount} ${transaction.asset.symbol}`,
            },
          });
          await syncNotificationUnreadCount(activeGroupStore.id);
        }
      }
    };

    const handleStore = (transfers: ITransaction[]) => {
      for (const transfer of transfers) {
        const objectTrxId = transfer.uuid.split(' ')[0];
        if (!objectTrxId) {
          console.error(new Error(`ObjectTrxId not found from transaction ${transfer.uuid}`));
          return;
        }
        const storeObject = activeGroupStore.objectMap[objectTrxId];
        if (storeObject) {
          storeObject.Extra.transferCount = (storeObject.Extra.transferCount || 0) + 1;
          activeGroupStore.updateObject(storeObject.TrxId, storeObject);
        }
        const cachedObject = activeGroupStore.getCachedObject(store.activeGroupStore.id, objectTrxId);
        if (cachedObject) {
          cachedObject.Extra.transferCount = (cachedObject.Extra.transferCount || 0) + 1;
        }
        const storeComment = commentStore.map[objectTrxId];
        if (storeComment) {
          storeComment.Extra.transferCount = (storeComment.Extra.transferCount || 0) + 1;
          commentStore.updateComment(storeComment.TrxId, storeComment);
        }
      }
    };

    return () => {
      stop = true;
    };
  }, []);
};

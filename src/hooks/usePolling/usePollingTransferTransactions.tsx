import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import MVMApi from 'apis/mvm';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import { addMilliseconds } from 'date-fns';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';

const LAST_SYNC_TRANSFER_TIMESTAMP_KEY = 'lastSyncTransactionTimestamp';

export default (duration: number) => {
  const store = useStore();
  const { nodeStore, groupStore, activeGroupStore } = store;
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
        const activeGroup = groupStore.map[activeGroupStore.id];
        if (activeGroup) {
          const receivedTransactions = transfers.filter((transfer) => transfer.to === activeGroup.user_eth_addr);
          for (const transaction of receivedTransactions) {
            const ObjectTrxId = transaction.uuid.split(' ')[0];
            if (!ObjectTrxId) {
              console.error(new Error(`ObjectTrxId not found from transaction ${transaction.uuid}`));
              return;
            }
            await NotificationModel.create(database, {
              GroupId: activeGroupStore.id,
              ObjectTrxId: ObjectTrxId || '',
              fromPublisher: activeGroup.user_pubkey,
              Type: NotificationModel.NotificationType.objectTransaction,
              Status: NotificationModel.NotificationStatus.unread,
              TimeStamp: new Date().getTime() * 1000000,
              Extra: {
                memo: `${transaction.amount} ${transaction.asset.symbol}`,
              },
            });
            await syncNotificationUnreadCount(activeGroupStore.id);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

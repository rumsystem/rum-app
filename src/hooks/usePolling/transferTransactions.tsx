import sleep from 'utils/sleep';
import { store } from 'store';
import MVMApi, { ITransaction } from 'apis/mvm';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import { addMilliseconds } from 'date-fns';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import * as NotificationModel from 'hooks/useDatabase/models/notification';
import useSyncNotificationUnreadCount from 'hooks/useSyncNotificationUnreadCount';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as PostModel from 'hooks/useDatabase/models/posts';

const LAST_SYNC_TRANSFER_TIMESTAMP_KEY = 'lastSyncTransactionTimestamp';

export const transferTransactions = async () => {
  const { nodeStore, groupStore, activeGroupStore, commentStore } = store;
  const database = useDatabase();
  const syncNotificationUnreadCount = useSyncNotificationUnreadCount(database, store);

  if (!nodeStore.quitting) {
    await fetchTransferTransactions();
    await sleep(1000);
  }

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
      const transfers = (res.data || []).filter((transfer) => transfer.type === 'TRANSFER' && transfer.asset?.rumSymbol);
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

  async function handleNotification(transfers: ITransaction[]) {
    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];
    if (activeGroup) {
      const receivedTransactions = transfers.filter((transfer) => transfer.to === activeGroup.user_eth_addr);
      for (const transaction of receivedTransactions) {
        const objectId = transaction.uuid.split(' ')[0];
        if (!objectId) {
          console.error(new Error(`objectTrxId not found from transaction ${transaction.uuid}`));
          return;
        }
        const [object, comment] = await Promise.all([
          PostModel.get(database, {
            id: objectId,
            groupId,
            raw: true,
          }),
          CommentModel.get(database, {
            id: objectId,
            groupId,
            raw: true,
          }),
        ]);
        if (!object && !comment) {
          return;
        }
        await NotificationModel.add(database, {
          GroupId: activeGroupStore.id,
          ObjectId: objectId || '',
          fromPublisher: activeGroup.user_pubkey,
          Type: object ? NotificationModel.NotificationType.objectTransaction : NotificationModel.NotificationType.commentTransaction,
          Status: NotificationModel.NotificationStatus.unread,
          TimeStamp: new Date().getTime() * 1000000,
          Extra: {
            memo: `${transaction.value} ${transaction.asset.rumSymbol}`,
          },
        });
        await syncNotificationUnreadCount(activeGroupStore.id);
      }
    }
  }

  function handleStore(transfers: ITransaction[]) {
    for (const transfer of transfers) {
      const objectTrxId = (transfer.uuid || '').split(' ')[0];
      if (!objectTrxId) {
        return;
      }
      const storeObject = activeGroupStore.postMap[objectTrxId];
      if (storeObject) {
        storeObject.extra.transferCount = (storeObject.extra.transferCount || 0) + 1;
        activeGroupStore.updatePost(storeObject.id, storeObject);
      }
      const cachedObject = activeGroupStore.getCachedObject(store.activeGroupStore.id, objectTrxId);
      if (cachedObject) {
        cachedObject.extra.transferCount = (cachedObject.extra.transferCount || 0) + 1;
      }
      const storeComment = commentStore.map[objectTrxId];
      if (storeComment) {
        storeComment.extra.transferCount = (storeComment.extra.transferCount || 0) + 1;
        commentStore.updateComment(storeComment.id, storeComment);
      }
    }
  }
};

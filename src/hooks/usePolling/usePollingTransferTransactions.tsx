import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import MVMApi from 'apis/mvm';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import { addMilliseconds } from 'date-fns';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

const LAST_SYNC_TRANSFER_TIMESTAMP_KEY = 'lastSyncTransactionTimestamp';

export default (duration: number) => {
  const { nodeStore } = useStore();
  const database = useDatabase();

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
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

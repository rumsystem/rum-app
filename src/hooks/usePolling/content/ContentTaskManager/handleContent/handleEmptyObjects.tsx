import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import * as EmptyTrxModel from 'hooks/useDatabase/models/emptyTrx';
import { state } from 'hooks/usePolling/content/EmptyContentManager/state';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects } = options;
  if (objects.length === 0) { return; }

  try {
    await database.transaction('rw', [database.emptyTrx], async () => {
      const itemsToPut: Array<EmptyTrxModel.IDBEmptyTrx> = objects.map((v) => ({
        groupId,
        trxId: v.TrxId,
        lastChecked: Date.now(),
        timestamp: v.TimeStamp,
      }));
      await EmptyTrxModel.bulkPut(database, itemsToPut);
      itemsToPut.forEach((v) => {
        state.items.push(v);
      });
    });
  } catch (e) {
    console.error(e);
  }
};

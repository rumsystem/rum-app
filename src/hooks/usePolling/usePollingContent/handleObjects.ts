import { IObjectItem } from 'apis/group';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ObjectModel from 'hooks/useDatabase/models/object';

interface IOptions {
  groupId: string
  objects: IObjectItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { objects } = options;

  if (objects.length === 0) {
    return;
  }

  await handleUnread(options);

  await saveObjects(options);

  await handleLatestStatus(options);
};

async function saveObjects(options: IOptions) {
  const { groupId, objects, store, database } = options;
  for (const object of objects) {
    try {
      const whereOptions = {
        TrxId: object.TrxId,
      };
      const existObject = await ObjectModel.get(database, whereOptions);

      if (existObject && existObject.Status !== ContentStatus.syncing) {
        continue;
      }

      if (existObject) {
        await ObjectModel.markedAsSynced(database, whereOptions);
        if (store.activeGroupStore.id === groupId) {
          const syncedObject = await ObjectModel.get(database, whereOptions);
          if (syncedObject) {
            store.activeGroupStore.updateObject(
              existObject.TrxId,
              syncedObject,
            );
          }
        }
      } else {
        await ObjectModel.create(database, {
          ...object,
          GroupId: groupId,
          Status: ContentStatus.synced,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

async function handleUnread(options: IOptions) {
  const { database, groupId, objects, store } = options;
  const { latestStatusStore } = store;
  const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const unreadObjects = [];
  for (const object of objects) {
    const existObject = await ObjectModel.get(database, {
      TrxId: object.TrxId,
    });
    if (!existObject && object.TimeStamp > latestStatus.latestReadTimeStamp) {
      unreadObjects.push(object);
    }
  }
  if (unreadObjects.length > 0) {
    const unreadCount = latestStatus.unreadCount + unreadObjects.length;
    await latestStatusStore.updateMap(database, groupId, {
      unreadCount,
    });
  }
}

async function handleLatestStatus(options: IOptions) {
  const { database, groupId, objects, store } = options;
  const { latestStatusStore } = store;
  const latestObject = objects[objects.length - 1];
  await latestStatusStore.updateMap(database, groupId, {
    latestObjectTimeStamp: latestObject.TimeStamp,
  });
}

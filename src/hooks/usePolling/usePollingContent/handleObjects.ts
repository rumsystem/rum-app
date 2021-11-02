import { IObjectItem } from 'apis/group';
import { Store } from 'store';
import { Database } from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { DEFAULT_LATEST_STATUS } from 'store/group';
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

  await saveObjects(options);

  handleUnread(options);

  handleLatestStatus(options);
};

async function saveObjects(options: IOptions) {
  const { groupId, objects, store, database } = options;
  for (const object of objects) {
    try {
      const whereOptions = {
        TrxId: object.TrxId,
      };
      const existObject = await ObjectModel.get(database, whereOptions);

      if (existObject && existObject.Status === ContentStatus.synced) {
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

function handleUnread(options: IOptions) {
  const { groupId, objects, store } = options;
  const { groupStore, activeGroupStore } = store;
  const latestStatus = groupStore.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS;
  const unreadObjects = objects.filter(
    (object) =>
      !activeGroupStore.objectTrxIdSet.has(object.TrxId)
      && object.TimeStamp > latestStatus.latestReadTimeStamp,
  );
  if (unreadObjects.length > 0) {
    const unreadCount = latestStatus.unreadCount + unreadObjects.length;
    groupStore.updateLatestStatusMap(groupId, {
      unreadCount,
    });
  }
}

function handleLatestStatus(options: IOptions) {
  const { groupId, objects, store } = options;
  const { groupStore } = store;
  const latestObject = objects[objects.length - 1];
  groupStore.updateLatestStatusMap(groupId, {
    latestObjectTimeStamp: latestObject.TimeStamp,
  });
}

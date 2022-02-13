import { INoteItem } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { isEmpty, keyBy } from 'lodash';
import transferRelations from 'hooks/useDatabase/models/relations/transferRelations';
import ContentDetector from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: INoteItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, store } = options;
  let { objects } = options;
  const { latestStatusStore, mutedListStore } = store;
  const activeGroupMutedPublishers = mutedListStore.mutedList.filter((muted) => muted.groupId === groupId).map((muted) => muted.publisher);

  if (objects.length === 0) {
    return;
  }

  try {
    await database.transaction(
      'rw',
      [
        database.objects,
        database.summary,
        database.persons,
        database.comments,
        database.likes,
        database.overwriteMapping,
      ],
      async () => {
        const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
        const latestObject = objects[objects.length - 1];

        const deleteActionObjects = objects.filter(ContentDetector.isDeleteAction);
        const deletedObjectTrxIds = deleteActionObjects.map((object) => object.Content.id || '');

        objects = objects.filter((object) => !ContentDetector.isDeleteAction(object) && !deletedObjectTrxIds.includes(object.TrxId));

        const overwriteMap = {} as Record<string, string>;
        const overwriteTrxIds = [] as string[];
        for (const object of objects) {
          const overwriteTrxId = object.Content.id;
          if (overwriteTrxId) {
            overwriteMap[object.TrxId] = overwriteTrxId;
            overwriteTrxIds.push(overwriteTrxId);
          }
        }

        const existObjects = await ObjectModel.bulkGet(database, objects.map((v) => v.TrxId), {
          raw: true,
        });
        const items = objects.map((object, i) => ({ object, existObject: existObjects[i] }));

        // unread
        const unreadObjects = [];
        items.forEach(({ object, existObject }) => {
          if (!object) { return; }
          if (
            !existObject
            && object.TimeStamp > latestStatus.latestReadTimeStamp
            && !activeGroupMutedPublishers.includes(object.Publisher)
            && !overwriteTrxIds.includes(object.TrxId)
          ) {
            unreadObjects.push(object);
          }
        });

        // save
        const objectsToAdd: Array<ObjectModel.IDbObjectItemPayload> = [];
        const objectIdsToMarkAsynced: Array<number> = [];
        items.filter((v) => !v.existObject).forEach(({ object }) => {
          objectsToAdd.push({
            ...object,
            GroupId: groupId,
            Status: ContentStatus.synced,
          });
        });
        items.filter((v) => v.existObject).forEach(({ existObject }) => {
          if (existObject && existObject.Status !== ContentStatus.syncing) {
            return;
          }
          objectIdsToMarkAsynced.push(existObject.Id!);
          if (store.activeGroupStore.id === groupId) {
            store.activeGroupStore.markSyncedObject(existObject.TrxId);
          } else {
            const cachedObject = store.activeGroupStore.getCachedObject(groupId, existObject.TrxId);
            if (cachedObject) {
              cachedObject.Status = ContentStatus.synced;
            }
          }
        });

        const unreadCount = latestStatus.unreadCount + unreadObjects.length;
        await Promise.all([
          ObjectModel.bulkCreate(database, objectsToAdd),
          ObjectModel.bulkMarkAsSynced(database, objectIdsToMarkAsynced),
        ]);
        latestStatusStore.update(groupId, {
          unreadCount,
          latestObjectTimeStamp: latestObject.TimeStamp,
        });

        if (!isEmpty(overwriteMap)) {
          const _objects = await ObjectModel.bulkGet(database, [...Object.keys(overwriteMap), ...Object.values(overwriteMap)], {
            raw: true,
          });
          const map = keyBy(_objects, 'TrxId');
          const tasks = Object.entries(overwriteMap).map(([toTrxId, fromTrxId]) => transferRelations(database, {
            fromObject: map[fromTrxId],
            toObject: map[toTrxId],
          }));
          await Promise.all(tasks);
          if (store.activeGroupStore.id === groupId) {
            store.activeGroupStore.deleteObjects(overwriteTrxIds);
          }
        }

        if (deletedObjectTrxIds.length > 0) {
          await ObjectModel.bulkRemove(database, deletedObjectTrxIds);
          if (store.activeGroupStore.id === groupId) {
            store.activeGroupStore.deleteObjects(deletedObjectTrxIds);
          }
        }
      },
    );
  } catch (e) {
    console.error(e);
  }
};

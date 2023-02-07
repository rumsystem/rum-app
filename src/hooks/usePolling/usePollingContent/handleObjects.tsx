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
  const { database, groupId, objects, store } = options;
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

        const deleteActionObjects = objects.filter(ContentDetector.isDeleteAction);
        const deletedObjectTrxIds = deleteActionObjects.map((object) => object.Content.id || '');

        const overwriteMap = {} as Record<string, string>;
        for (const object of objects) {
          const fromTrxId = object.Content.id;
          if (fromTrxId) {
            overwriteMap[object.TrxId] = fromTrxId;
          }
        }
        const toTrxIds = Object.keys(overwriteMap);
        const fromTrxIds = Object.values(overwriteMap);

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
            && !fromTrxIds.includes(object.TrxId)
            && !ContentDetector.isDeleteAction(object)
            && !deletedObjectTrxIds.includes(object.TrxId)
          ) {
            unreadObjects.push(object);
          }
        });

        const objectsToAdd = items.filter((v) => !v.existObject && !ContentDetector.isDeleteAction(v.object)).map((v) => ({
          ...v.object,
          GroupId: groupId,
          Status: ContentStatus.synced,
        })) as ObjectModel.IDbObjectItemPayload[];


        const objectsToMarkSynced = existObjects.filter((o) => o && o.Status === ContentStatus.syncing);
        for (const object of objectsToMarkSynced) {
          if (store.activeGroupStore.id === groupId) {
            store.activeGroupStore.markSyncedObject(object.TrxId);
          } else {
            const cachedObject = store.activeGroupStore.getCachedObject(groupId, object.TrxId);
            if (cachedObject) {
              cachedObject.Status = ContentStatus.synced;
            }
          }
        }

        const unreadCount = latestStatus.unreadCount + unreadObjects.length;
        await Promise.all([
          ObjectModel.bulkCreate(database, objectsToAdd),
          ObjectModel.bulkMarkAsSynced(database, objectsToMarkSynced.map((o) => o.Id || 0)),
        ]);
        const latestObject = objects[objects.length - 1];
        latestStatusStore.update(groupId, {
          unreadCount,
          latestObjectTimeStamp: latestObject.TimeStamp,
        });

        if (!isEmpty(overwriteMap)) {
          const _objects = await ObjectModel.bulkGet(database, [...fromTrxIds, ...toTrxIds], {
            raw: true,
          });
          const map = keyBy(_objects, 'TrxId');
          const tasks = Object.entries(overwriteMap).map(([toTrxId, fromTrxId]) => transferRelations(database, {
            fromObject: map[fromTrxId],
            toObject: map[toTrxId],
          }));
          await Promise.all(tasks);
          if (store.activeGroupStore.id === groupId) {
            store.activeGroupStore.deleteObjects(fromTrxIds);
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

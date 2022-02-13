import { INoteItem } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { isEmpty, keyBy } from 'lodash';
import transferRelations from 'hooks/useDatabase/models/relations/transferRelations';

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

        const overwriteMap = {} as Record<string, string>;
        const overwriteTrxIds = [] as string[];
        for (const object of objects) {
          const overwriteTrxId = object.Content.id;
          if (overwriteTrxId) {
            overwriteMap[object.TrxId] = overwriteTrxId;
            overwriteTrxIds.push(overwriteTrxId);
          }
        }

        console.log({ overwriteMap, overwriteTrxIds });

        const existObjects = await ObjectModel.bulkGet(database, objects.map((v) => v.TrxId), {
          raw: true,
        });
        const items = objects.map((object, i) => ({ object, existObject: existObjects[i] }));

        // unread
        const unreadObjects = [];
        items.forEach(({ object, existObject }) => {
          if (!object) { return; }
          if (!existObject && object.TimeStamp > latestStatus.latestReadTimeStamp && !activeGroupMutedPublishers.includes(object.Publisher) && !overwriteTrxIds.includes(object.TrxId)) {
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
            LatestTrxId: '',
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

        const latestObject = objects[objects.length - 1];
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
            for (const fromTrxId of overwriteTrxIds) {
              store.activeGroupStore.deleteObject(fromTrxId);
            }
          }
        }
      },
    );
  } catch (e) {
    console.error(e);
  }
};

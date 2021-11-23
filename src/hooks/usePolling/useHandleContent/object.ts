import React from 'react';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import {
  ContentTypeUrl,
  IObjectItem,
} from 'apis/content';
import * as ContentModel from 'hooks/useDatabase/models/content';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as globalLatestStatusModel from 'hooks/useDatabase/models/globalLatestStatus';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { groupBy, pick } from 'lodash';

const LIMIT = 200;

const contentToObject = (content: ContentModel.IDbContentItem) => pick(content, [
  'TrxId',
  'Publisher',
  'TypeUrl',
  'TimeStamp',
  'Content',
]) as IObjectItem;

export default (duration: number) => {
  const { latestStatusStore, nodeStore, activeGroupStore } = useStore();
  const database = useDatabase();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(3000);
      while (!stop && !nodeStore.quitting) {
        await handle();
        await sleep(duration);
      }
    })();

    async function handle() {
      try {
        const globalLatestStatus = await globalLatestStatusModel.get(database);
        const { latestObjectId } = globalLatestStatus.Status;
        const contents = await ContentModel.list(database, {
          limit: LIMIT,
          TypeUrl: ContentTypeUrl.Object,
          startId: latestObjectId,
        });
        const objects = contents.filter((content: any) => !content.Content.inreplyto);

        if (objects.length > 0) {
          console.log({ objects, latestObjectId });

          const groupedObjects = groupBy(objects, (object: ContentModel.IDbContentItem) => object.GroupId);

          if (groupedObjects[activeGroupStore.id]) {
            await handleByGroup(activeGroupStore.id, groupedObjects[activeGroupStore.id].map(contentToObject));
            delete groupedObjects[activeGroupStore.id];
          }

          for (const groupId of Object.keys(groupedObjects)) {
            await handleByGroup(groupId, groupedObjects[groupId].map(contentToObject));
          }
        }

        if (contents.length > 0) {
          const latestContent = contents[contents.length - 1];
          await globalLatestStatusModel.createOrUpdate(database, {
            latestObjectId: latestContent.Id,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function handleByGroup(groupId: string, objects: IObjectItem[]) {
      const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;

      const existObjects = await ObjectModel.bulkGet(database, objects.map((v) => v.TrxId), {
        withExtra: true,
      });
      const items = objects.map((object, i) => ({ object, existObject: existObjects[i] }));

      // unread
      const unreadObjects = [];
      items.forEach(({ object, existObject }) => {
        if (!object) { return; }
        if (!existObject && object.TimeStamp > latestStatus.latestReadTimeStamp) {
          unreadObjects.push(object);
        }
      });

      // save
      const objectsToAdd: Array<ObjectModel.IDbObjectItem> = [];
      const objectIdsToMarkAsynced: Array<number> = [];
      items.filter((v) => !v.existObject).forEach(({ object }) => {
        objectsToAdd.push({
          ...object,
          GroupId: groupId,
          Status: ContentStatus.synced,
        });
      });
      items.filter((v) => v.existObject).forEach(({ object, existObject }) => {
        if (existObject && existObject.Status !== ContentStatus.syncing) {
          return;
        }
        objectIdsToMarkAsynced.push(existObject.Id!);
        if (activeGroupStore.id === groupId) {
          const syncedObject = {
            ...existObject,
            ...object,
            Status: ContentStatus.synced,
          };
          activeGroupStore.updateObject(
            existObject.TrxId,
            syncedObject,
          );
        }
      });

      const latestObject = objects[objects.length - 1];
      const unreadCount = latestStatus.unreadCount + unreadObjects.length;
      await Promise.all([
        ObjectModel.bulkCreate(database, objectsToAdd),
        ObjectModel.bulkMarkedAsSynced(database, objectIdsToMarkAsynced),
        latestStatusStore.updateMap(database, groupId, {
          unreadCount,
          latestObjectTimeStamp: latestObject.TimeStamp,
        }),
      ]);
    }

    return () => {
      stop = true;
    };
  }, []);
};

import { IObjectItem, ContentTypeUrl } from 'apis/group';
import { Store } from 'store';
import Database, { ContentStatus } from 'store/database';
import { DEFAULT_LATEST_STATUS } from 'store/group';

export default async (
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) => {
  if (objects.length === 0) {
    return;
  }

  await saveObjects(groupId, objects, store);

  await saveObjectSummary(groupId, objects);

  handleUnread(groupId, objects, store);

  handleLatestStatus(groupId, objects, store);
};

async function saveObjects(
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) {
  const db = new Database();
  for (const object of objects) {
    try {
      const existObject = await db.objects.get({
        TrxId: object.TrxId,
      });

      if (existObject && existObject.Status === ContentStatus.Synced) {
        continue;
      }

      if (existObject) {
        await db.objects
          .where({
            GroupId: groupId,
            TrxId: object.TrxId,
          })
          .modify({
            ...object,
            Status: ContentStatus.Synced,
          });
        if (store.activeGroupStore.objectMap[object.TrxId]) {
          store.activeGroupStore.objectMap[object.TrxId].Status =
            ContentStatus.Synced;
        }
      } else {
        await db.objects.add({
          ...object,
          GroupId: groupId,
          Status: ContentStatus.Synced,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

async function saveObjectSummary(groupId: string, objects: IObjectItem[] = []) {
  const db = new Database();
  const publishers = Array.from(
    new Set(objects.map((object) => object.Publisher))
  );
  for (const publisher of publishers) {
    try {
      const objectSummaryQuery = {
        GroupId: groupId,
        Publisher: publisher,
        TypeUrl: ContentTypeUrl.Object,
      };
      const count = await db.objects
        .where({
          GroupId: groupId,
          Publisher: publisher,
          Status: ContentStatus.Synced,
        })
        .count();
      const existObjectSummary = await db.summary.get(objectSummaryQuery);
      if (existObjectSummary) {
        await db.summary.where(objectSummaryQuery).modify({
          Count: count,
        });
      } else {
        await db.summary.add({
          ...objectSummaryQuery,
          Count: count,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

function handleUnread(
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) {
  const { groupStore, activeGroupStore, nodeStore } = store;
  const latestStatus =
    groupStore.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS;
  const unreadObjects = objects.filter(
    (object) =>
      (!activeGroupStore.objectTrxIdSet.has(object.TrxId) &&
        nodeStore.info.node_publickey !== object.Publisher &&
        object.TimeStamp > latestStatus.latestReadTimeStamp) ||
      !latestStatus ||
      !latestStatus.latestReadTimeStamp
  );
  if (unreadObjects.length > 0) {
    const unreadCount = latestStatus.unreadCount + unreadObjects.length;
    groupStore.updateLatestStatusMap(groupId, {
      unreadCount,
    });
  }
}

function handleLatestStatus(
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) {
  const { groupStore } = store;
  const latestObject = objects[objects.length - 1];
  console.log({ latestObject });
  groupStore.updateLatestStatusMap(groupId, {
    latestObjectTimeStamp: latestObject.TimeStamp,
  });
}

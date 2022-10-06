import { IObjectItem, ContentTypeUrl } from 'apis/group';
import { Store } from 'store';
import { Database, ContentStatus } from 'hooks/useDatabase';
import { DEFAULT_LATEST_STATUS } from 'store/group';

interface IOptions {
  groupId: string;
  objects: IObjectItem[];
  store: Store;
  database: Database;
}

export default async (options: IOptions) => {
  const { objects } = options;

  if (objects.length === 0) {
    return;
  }

  await saveObjects(options);

  await saveObjectSummary(options);

  handleUnread(options);

  handleLatestStatus(options);
};

async function saveObjects(options: IOptions) {
  const { groupId, objects, store, database } = options;
  const db = database;
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

async function saveObjectSummary(options: IOptions) {
  const { groupId, objects, database } = options;
  const db = database;
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

function handleUnread(options: IOptions) {
  const { groupId, objects, store } = options;
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

function handleLatestStatus(options: IOptions) {
  const { groupId, objects, store } = options;
  const { groupStore } = store;
  const latestObject = objects[objects.length - 1];
  groupStore.updateLatestStatusMap(groupId, {
    latestObjectTimeStamp: latestObject.TimeStamp,
  });
}

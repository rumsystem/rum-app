import { IObjectItem, ContentTypeUrl } from 'apis/group';
import { Store } from 'store';
import Database, { ContentStatus } from 'store/database';

export default async (
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) => {
  if (objects.length === 0) {
    return;
  }

  await saveObjects(groupId, objects);

  await saveObjectSummary(groupId, objects);

  handleUnread(groupId, objects, store);
};

async function saveObjects(groupId: string, objects: IObjectItem[] = []) {
  const db = new Database();
  for (const object of objects) {
    try {
      const syncingObject = await db.objects.get({
        TrxId: object.TrxId,
      });
      if (syncingObject) {
        await db.objects
          .where({
            GroupId: groupId,
            TrxId: object.TrxId,
          })
          .modify({
            Status: ContentStatus.Synced,
          });
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
  const { groupStore, activeGroupStore } = store;
  const latestStatus = groupStore.latestStatusMap[groupId];
  const unreadObjects = objects.filter(
    (object) =>
      !activeGroupStore.objectTrxIdSet.has(object.TrxId) &&
      latestStatus &&
      object.TimeStamp > (latestStatus.latestReadTimeStamp || 0)
  );
  if (unreadObjects.length > 0) {
    const unreadCount =
      (groupStore.safeLatestStatusMap[groupId].unreadCount || 0) +
      unreadObjects.length;
    groupStore.updateLatestStatusMap(groupId, {
      unreadCount,
    });
  }
}

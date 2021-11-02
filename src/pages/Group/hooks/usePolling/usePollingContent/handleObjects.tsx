import { IObjectItem } from 'apis/group';
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
        console.log(` ------------- synced object ---------------`);
        console.log({ syncingObject });
        await db.objects
          .where({
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
      };
      const count = await db.objects
        .where({
          GroupId: groupId,
          Publisher: publisher,
          Publisher: publisher,
          Status: ContentStatus.Synced,
        })
        .count();
      const existObjectSummary = await db.objectSummary.get(objectSummaryQuery);
      if (existObjectSummary) {
        await db.objectSummary.where(objectSummaryQuery).modify({
          Count: count,
        });
      } else {
        await db.objectSummary.add({
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
  const { groupStore, nodeStore } = store;
  const latestStatus = groupStore.latestStatusMap[groupId];
  const unreadObjects = objects.filter(
    (object) =>
      object.Publisher !== nodeStore.info.node_publickey &&
      latestStatus &&
      object.TimeStamp > (latestStatus.latestReadTimeStamp || 0)
  );
  if (unreadObjects.length > 0) {
    const unreadCount =
      (groupStore.unReadCountMap[groupId] || 0) + unreadObjects.length;
    groupStore.updateUnReadCountMap(groupId, unreadCount);
  }
}

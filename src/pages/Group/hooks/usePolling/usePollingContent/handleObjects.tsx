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

  for (const object of objects) {
    try {
      await saveObject(groupId, object);
      await saveObjectSummary(groupId, object.Publisher);
    } catch (err) {
      console.log(err);
    }
  }

  handleUnread(groupId, objects, store);
};

async function saveObject(groupId: string, object: IObjectItem) {
  const db = new Database();
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
}

async function saveObjectSummary(groupId: string, Publisher: string) {
  const db = new Database();
  const objectSummaryQuery = {
    GroupId: groupId,
    Publisher: Publisher,
  };
  const count = await db.objects
    .where({
      GroupId: groupId,
      Publisher: Publisher,
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

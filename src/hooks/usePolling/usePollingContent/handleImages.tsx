import { INoteItem } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ImageModel from 'hooks/useDatabase/models/image';
import { ImageActivityType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: INoteItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects } = options;

  if (objects.length === 0) { return; }

  try {
    await database.transaction('rw', [database.images], async () => {
      const items = objects.map((v) => ({
        content: v,
        activity: v.Content as any as ImageActivityType,
      }));
      const existedImages = await ImageModel.bulkGet(database, items.map((v) => ({ id: v.activity.object.id, groupId })));
      const imagesToPut: Array<ImageModel.IDBImage> = [];

      for (const item of items) {
        const object = item.activity.object;
        const existedImage = existedImages.find((v) => v.id === object.id);
        if (existedImage) {
          if (existedImage.status === ContentStatus.syncing) {
            existedImage.status = ContentStatus.synced;
            imagesToPut.push(existedImage);
          }
          continue;
        }
        imagesToPut.push({
          id: object.id,
          groupId,
          trxId: item.content.TrxId,
          mediaType: object.mediaType,
          content: object.content,
          publisher: item.content.Publisher,
          timestamp: item.content.TimeStamp,
          status: ContentStatus.synced,
        });
      }

      await ImageModel.bulkPut(database, imagesToPut);
    });
  } catch (e) {
    console.error(e);
  }
};

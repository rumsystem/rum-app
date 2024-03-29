import { parseISO } from 'date-fns';
import { utils } from 'rum-sdk-browser';
import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ImageModel from 'hooks/useDatabase/models/image';
import { ImageActivityType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: IContentItem[]
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
        activity: v.Data as any as ImageActivityType,
      }));
      const existedImages = await ImageModel.bulkGet(database, items.map((v) => ({ id: v.activity.object.id, groupId })));
      const imagesToPut: Array<ImageModel.IDBImage> = [];
      const imagesToAdd: Array<ImageModel.IDBImage> = [];

      for (const item of items) {
        const object = item.activity.object;
        const timestamp = item.activity.published
          ? parseISO(item.activity.published).getTime()
          : Number(item.content.TimeStamp.slice(0, -6));
        const existedImage = existedImages.find((v) => v.id === object.id);
        const dupeImage = imagesToAdd.find((v) => v.id === object.id);
        if (dupeImage) { continue; }
        if (existedImage) {
          const updateExistedImage = existedImage.status === ContentStatus.syncing
            && existedImage.publisher === item.content.SenderPubkey
            && existedImage.trxId === item.content.TrxId;
          if (updateExistedImage) {
            existedImage.status = ContentStatus.synced;
            imagesToPut.push(existedImage);
          }
          continue;
        }
        imagesToAdd.push({
          id: object.id,
          groupId,
          trxId: item.content.TrxId,
          mediaType: object.mediaType,
          content: object.content,
          publisher: item.content.SenderPubkey,
          userAddress: utils.pubkeyToAddress(item.content.SenderPubkey),
          timestamp,
          status: ContentStatus.synced,
        });
      }

      await ImageModel.bulkPut(database, [...imagesToPut, ...imagesToAdd]);
    });
  } catch (e) {
    console.error(e);
  }
};

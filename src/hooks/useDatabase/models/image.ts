import type Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export interface IDBImage {
  id: string
  trxId: string
  groupId: string
  mediaType: string
  content: string
  publisher: string
  timestamp: number
  status: ContentStatus
}

export const add = async (db: Database, image: IDBImage) => {
  await db.images.add(image);
};

export const bulkAdd = async (db: Database, images: IDBImage[]) => {
  await db.images.bulkAdd(images);
};

export const bulkPut = async (db: Database, images: IDBImage[]) => {
  await db.images.bulkPut(images);
};

interface GetParamTrxId {
  groupId: string
  trxId: string
}
interface GetParamId {
  groupId: string
  id: string
}

export const get = async (db: Database, where: GetParamTrxId | GetParamId) => {
  const image = await db.images.get(where);
  return image;
};

interface BulkGet {
  (db: Database, data: Array<GetParamTrxId>): Promise<Array<IDBImage>>
  (db: Database, data2: Array<GetParamId>): Promise<Array<IDBImage>>
}

export const bulkGet: BulkGet = async (db, data) => {
  if (!data.length) { return []; }
  const images = 'trxId' in data[0]
    ? await db.images
      .where('[groupId+trxId]')
      .anyOf((data as Array<GetParamTrxId>).map((v) => [v.groupId, v.trxId]))
      .toArray()
    : await db.images
      .where('[groupId+id]')
      .anyOf((data as Array<GetParamId>).map((v) => [v.groupId, v.id]))
      .toArray();
  return images;
};

export const markAsSynced = async (db: Database, data: Array<GetParamTrxId> | Array<GetParamId>) => {
  await Promise.all(data.map(async (v) => {
    await db.images.where(v).modify({
      status: ContentStatus.synced,
    });
  }));
};

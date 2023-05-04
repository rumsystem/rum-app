import type Database from 'hooks/useDatabase/database';

export interface IDBWebsiteMetadata {
  url: string
  title: string
  description: string
  site: string
  image: string
  favicon: string
  imageBase64: string
  timestamp: number
}

export const put = async (db: Database, item: IDBWebsiteMetadata) => {
  await db.websiteMetadata.put(item);
};

export const get = (db: Database, url: string) => db.websiteMetadata.where({ url }).first();

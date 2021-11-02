import Dexie from 'dexie';
import 'dexie-export-import';
import fs from 'fs-extra';

export default class OffChainDatabase extends Dexie {
  follows: Dexie.Table<IDbFollowItem, number>;

  constructor() {
    super('OffChainDatabase');
    this.version(1).stores({
      follows: '++Id, GroupId, Publisher, Following',
    });
    this.follows = this.table('follows');
  }
}

(window as any).offChainDb = new OffChainDatabase();

export interface IDbFollowItem {
  Id?: number;
  GroupId: string;
  Publisher: string;
  Following: string;
  TimeStamp: number;
}

const getFilePath = (storagePath: string) => `${storagePath}/offChainData.json`;

export const importFrom = async (storagePath: string) => {
  const filePath = getFilePath(storagePath);
  const jsonString = await fs.readFile(filePath, 'utf8');
  await new OffChainDatabase().import(
    new Blob([jsonString], { type: 'application/json' }),
    {
      overwriteValues: true,
    }
  );
};

export const exportTo = async (storagePath: string) => {
  const filePath = getFilePath(storagePath);
  const blob = await new OffChainDatabase().export({
    prettyJson: true,
  });
  const jsonString = await blob.text();
  await fs.writeFile(filePath, jsonString);
};

export const remove = async (storagePath: string) => {
  const filePath = getFilePath(storagePath);
  await fs.remove(filePath);
  new OffChainDatabase().delete();
};

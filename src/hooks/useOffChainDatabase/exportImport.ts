import 'dexie-export-import';
import fs from 'fs-extra';
import type OffChainDatabase from './database';

const getFilePath = (storagePath: string) => `${storagePath}/offChainData.json`;

export const importFrom = async (
  database: OffChainDatabase,
  storagePath: string,
) => {
  const filePath = getFilePath(storagePath);
  const exist = await fs.pathExists(filePath);
  if (!exist) {
    return;
  }
  const jsonString = await fs.readFile(filePath, 'utf8');
  await database.import(new Blob([jsonString], { type: 'application/json' }), {
    overwriteValues: true,
  });
};

export const exportTo = async (
  database: OffChainDatabase,
  storagePath: string,
) => {
  const filePath = getFilePath(storagePath);
  const blob = await database.export({
    prettyJson: true,
  });
  const jsonString = await blob.text();
  await fs.writeFile(filePath, jsonString);
};

export const remove = async (
  database: OffChainDatabase,
  storagePath: string,
) => {
  const filePath = getFilePath(storagePath);
  await fs.remove(filePath);
  database.delete();
};

import 'dexie-export-import';
import fs from 'fs-extra';
import type OffChainDatabase from './database';

const getFilePath = (storagePath: string) => `${storagePath}/offChainData.json`;

export const tryImportFrom = async (
  database: OffChainDatabase,
  storagePath: string,
) => {
  try {
    const filePath = getFilePath(storagePath);
    const exist = await fs.pathExists(filePath);
    if (!exist) {
      return;
    }
    let isDirty = false;
    for (const table of database.tables) {
      const rawCount = await table.count();
      if (rawCount > 0) {
        isDirty = true;
        break;
      }
    }
    if (isDirty) {
      return;
    }
    const jsonString = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(jsonString);
    json.data.databaseName = database.name;
    await database.import(new Blob([JSON.stringify(json)], { type: 'application/json' }), {
      overwriteValues: true,
    });
  } catch (_) {}
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

import { ICreateGroupsResult } from 'apis/group';
import fs from 'fs-extra';
import Database from 'hooks/useDatabase/database';

export function createSeedStore() {
  return {
    async exists(path: string, db: Database, id: string) {
      if (process.env.IS_ELECTRON) {
        const filePath = `${path}/seeds/${id}.json`;
        return fs.pathExists(filePath);
      }

      const seed = await db.seedStore.get(id);
      return !!seed;
    },

    async addSeed(path: string, db: Database, id: string, seed: ICreateGroupsResult) {
      if (process.env.IS_ELECTRON) {
        const dir = `${path}/seeds`;
        await fs.ensureDir(dir);
        const filePath = `${dir}/${id}.json`;
        await fs.writeFile(filePath, JSON.stringify(seed));
        return;
      }
      await db.seedStore.add(JSON.stringify(seed), id);
    },

    async getSeed(path: string, db: Database, id: string) {
      if (process.env.IS_ELECTRON) {
        const filePath = `${path}/seeds/${id}.json`;
        const exist = await fs.pathExists(filePath);
        if (!exist) {
          return null;
        }
        const jsonString = await fs.readFile(filePath, 'utf8');
        return JSON.parse(jsonString);
      }
      const seed = await db.seedStore.get(id);
      return seed ? JSON.parse(seed) : null;
    },

    async deleteSeed(path: string, db: Database, id: string) {
      if (process.env.IS_ELECTRON) {
        const filePath = `${path}/seeds/${id}.json`;
        await fs.remove(filePath);
        return;
      }
      await db.seedStore.delete(id);
    },
  };
}

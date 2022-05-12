import { ICreateGroupsResult } from 'apis/group';
import fs from 'fs-extra';

export function createSeedStore() {
  return {
    async exists(path: string, id: string) {
      const filePath = `${path}/seeds/${id}.json`;
      return fs.pathExists(filePath);
    },

    async addSeed(path: string, id: string, seed: ICreateGroupsResult) {
      const dir = `${path}/seeds`;
      await fs.ensureDir(dir);
      const filePath = `${dir}/${id}.json`;
      await fs.writeFile(filePath, JSON.stringify(seed));
    },

    async getSeed(path: string, id: string) {
      const filePath = `${path}/seeds/${id}.json`;
      const exist = await fs.pathExists(filePath);
      if (!exist) {
        return null;
      }
      const jsonString = await fs.readFile(filePath, 'utf8');
      return JSON.parse(jsonString);
    },

    async deleteSeed(path: string, id: string) {
      const filePath = `${path}/seeds/${id}.json`;
      await fs.remove(filePath);
    },
  };
}

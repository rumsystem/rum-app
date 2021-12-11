import { ICreateGroupsResult } from 'apis/group';
// import fs from 'fs-extra';

export function createSeedStore() {
  return {
    async exists(_path: string, _id: string) {
      // TODO:
      return Promise.resolve(false);
      // const filePath = `${path}/seeds/${id}.json`;
      // return fs.pathExists(filePath);
    },

    async addSeed(_path: string, _id: string, _seed: ICreateGroupsResult) {
      // TODO:
      // const dir = `${path}/seeds`;
      // await fs.ensureDir(dir);
      // const filePath = `${dir}/${id}.json`;
      // await fs.writeFile(filePath, JSON.stringify(seed));
    },

    async getSeed(_path: string, _id: string) {
      // TODO:
      return Promise.resolve(null);
      // const filePath = `${path}/seeds/${id}.json`;
      // const exist = await fs.pathExists(filePath);
      // if (!exist) {
      //   return null;
      // }
      // const jsonString = await fs.readFile(filePath, 'utf8');
      // return JSON.parse(jsonString);
    },

    async deleteSeed(_path: string, _id: string) {
      // TODO:
      // const filePath = `${path}/seeds/${id}.json`;
      // await fs.remove(filePath);
    },
  };
}

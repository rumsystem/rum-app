import { IGroup, ICreateGroupsResult } from 'apis/group';
import Store from 'electron-store';

export const migrateSeed = async (groups: IGroup[]) => {
  const { groupStore, seedStore, nodeStore } = (window as any).store;
  try {
    const electronStore = new Store();
    const electronGroupStore = new Store({
      name: groupStore.electronStoreName,
    });
    for (const group of groups) {
      const seedKey = `group_seed_${group.GroupId}`;
      const seed =
        electronStore.get(seedKey) || electronGroupStore.get(seedKey);
      const exist = await seedStore.exists(
        nodeStore.storagePath,
        group.GroupId
      );
      if (!exist && seed) {
        await seedStore.addSeed(
          nodeStore.storagePath,
          group.GroupId,
          seed as ICreateGroupsResult
        );
      }
    }
  } catch (err) {
    console.log(err);
  }
};

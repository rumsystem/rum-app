import { keyBy } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

export interface IGroupFolder {
  id: string
  name: string
  items: string[]
  expand: boolean
}

const GROUPS_FOLDERS_STORE_KEY = 'groupFolders';

export function createSidebarStore() {
  return {
    collapsed: false,

    groupFolders: [] as IGroupFolder[],

    get groupFolderMap() {
      return keyBy(this.groupFolders, 'id');
    },

    get groupBelongsToFolderMap() {
      const map = {} as Record<string, IGroupFolder>;
      for (const folder of this.groupFolders) {
        for (const item of folder.items) {
          map[item] = folder;
        }
      }
      return map;
    },

    collapse() {
      this.collapsed = true;
    },

    restore() {
      this.collapsed = false;
    },

    toggle() {
      this.collapsed = !this.collapsed;
    },

    initGroupFolders() {
      this.groupFolders = (ElectronCurrentNodeStore.getStore().get(GROUPS_FOLDERS_STORE_KEY) || []) as IGroupFolder[];
    },

    addEmptyGroupFolder() {
      this.groupFolders.push({
        id: uuidV4(),
        name: '',
        items: [],
        expand: false,
      });
    },

    setGroupFolders(folders: IGroupFolder[]) {
      this.groupFolders = folders;
      ElectronCurrentNodeStore.getStore().set(GROUPS_FOLDERS_STORE_KEY, this.groupFolders);
    },

    unshiftGroupFolder(folder: IGroupFolder) {
      this.groupFolders.unshift(folder);
      ElectronCurrentNodeStore.getStore().set(GROUPS_FOLDERS_STORE_KEY, this.groupFolders);
    },

    updateGroupFolder(id: string, folder: IGroupFolder) {
      this.groupFolders = this.groupFolders.map((f) => (f.id === id ? folder : f));
      ElectronCurrentNodeStore.getStore().set(GROUPS_FOLDERS_STORE_KEY, this.groupFolders);
    },

    removeGroupFolder(id: string) {
      this.groupFolders = this.groupFolders.filter((g) => g.id !== id);
      ElectronCurrentNodeStore.getStore().set(GROUPS_FOLDERS_STORE_KEY, this.groupFolders);
    },
  };
}

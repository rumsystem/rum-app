import { IPersonItem } from 'apis/group';
import Store from 'electron-store';
import { sortBy } from 'lodash';

interface IProfileMap {
  [publisher: string]: IPersonItem;
}

export function createProfileStore() {
  let electronStore: Store;

  return {
    latestTrxId: '',

    profileMap: {} as IProfileMap,

    electronStoreName: '',

    addProfiles(profiles: IPersonItem[]) {
      const sortedProfiles = sortBy(profiles, ['TimeStamp']);
      const last = sortedProfiles[sortedProfiles.length - 1];
      if (last.TrxId === this.latestTrxId) {
        return;
      }
      for (const profile of sortedProfiles) {
        this.profileMap[profile.Publisher] = profile;
      }
      this.latestTrxId = last.TrxId;
      electronStore.set('profileMap', this.profileMap);
      electronStore.set('latestTrxId', this.latestTrxId);
    },

    initElectronStore(name: string) {
      electronStore = new Store({
        name,
      });
      this.electronStoreName = name;
      this._syncFromElectronStore();
    },

    resetElectronStore() {
      if (!electronStore) {
        return;
      }
      electronStore.clear();
    },

    _syncFromElectronStore() {
      this.profileMap = (electronStore.get(`profileMap`) || {}) as IProfileMap;
      this.latestTrxId = (electronStore.get(`latestTrxId`) || '') as string;
    },
  };
}

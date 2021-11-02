import Store from 'electron-store';

interface LastReadContentTrxIdMap {
  [key: string]: number;
}

const store = new Store();
const STORE_GROUP_LAST_READ_CONTENT_TIME_STAMP_MAP =
  'LAST_GROUP_READ_CONTENT_TIME_STAMP_MAP';

export function createUnReadContentStore() {
  return {
    lastReadContentMap: (store.get(
      STORE_GROUP_LAST_READ_CONTENT_TIME_STAMP_MAP
    ) || {}) as LastReadContentTrxIdMap,

    setLastReadContentTimeStamp(groupId: string, timeStamp: number) {
      this.lastReadContentMap[groupId] = timeStamp;
      store.set(
        STORE_GROUP_LAST_READ_CONTENT_TIME_STAMP_MAP,
        this.lastReadContentMap
      );
    },
  };
}

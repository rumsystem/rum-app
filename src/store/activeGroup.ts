import { IGroup, IContentItem } from 'apis/group';
import Store from 'electron-store';
import moment from 'moment';

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

export function createActiveGroupStore() {
  let electronStore: Store;

  return {
    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    contentTrxIds: <string[]>[],

    contentMap: <{ [key: string]: IContentItem }>{},

    justAddedContentTrxId: '',

    contentStatusMap: <{ [key: string]: Status }>{},

    latestContentTimeStampSet: new Set(),

    rearContentTimeStamp: 0,

    electronStoreName: '',

    get isActive() {
      return !!this.id;
    },

    get contentTotal() {
      return this.contentTrxIds.length;
    },

    get contents() {
      return this.contentTrxIds
        .map((trxId: any) => this.contentMap[trxId])
        .sort((a, b) => b.TimeStamp - a.TimeStamp);
    },

    initElectronStore(name: string) {
      electronStore = new Store({
        name,
      });
      this.electronStoreName = name;
    },

    resetElectronStore() {
      if (!electronStore) {
        return;
      }
      electronStore.clear();
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      this.id = id;
      this.clearAfterGroupChanged();
    },

    clearAfterGroupChanged() {
      this.contentTrxIds = [];
      this.contentMap = {};
      this.justAddedContentTrxId = '';
      this.latestContentTimeStampSet.clear();
    },

    addContents(contents: IContentItem[] = []) {
      for (const content of contents) {
        this.addContent(content);
      }
    },

    addContent(content: IContentItem) {
      this.contentStatusMap[content.TrxId] = this.getContentStatus(content);
      if (this.contentMap[content.TrxId]) {
        if (!this.contentMap[content.TrxId].Publisher && content.Publisher) {
          this.contentMap[content.TrxId] = content;
        }
      } else {
        this.contentTrxIds.unshift(content.TrxId);
        this.contentMap[content.TrxId] = content;
      }
    },

    setJustAddedContentTrxId(trxId: string) {
      this.justAddedContentTrxId = trxId;
    },

    addLatestContentTimeStamp(timestamp: number) {
      this.latestContentTimeStampSet.add(timestamp);
    },

    setRearContentTimeStamp(timeStamp: number) {
      this.rearContentTimeStamp = timeStamp;
    },

    getContentStatus(content: IContentItem) {
      if (content.Publisher) {
        return Status.PUBLISHED;
      }
      if (
        moment
          .duration(moment().diff(moment(content.TimeStamp / 1000000)))
          .asSeconds() > 20
      ) {
        return Status.FAILED;
      }
      return Status.PUBLISHING;
    },

    markAsFailed(txId: string) {
      this.contentStatusMap[txId] = Status.FAILED;
    },

    getFailedContents() {
      return (electronStore.get(`failedContents_${this.id}`) ||
        []) as IContentItem[];
    },

    addFailedContent(content: IContentItem) {
      const failedContents = (electronStore.get(`failedContents_${this.id}`) ||
        []) as IContentItem[];
      failedContents.push(content);
      electronStore.set(`failedContents_${this.id}`, failedContents);
    },
  };
}

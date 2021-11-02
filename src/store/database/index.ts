import Dexie from 'dexie';
import { IObjectItem, IPersonItem } from 'apis/group';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  objectSummary: Dexie.Table<IDbObjectSummary, number>;

  constructor() {
    super('Database');
    this.version(1).stores({
      objects: '&TrxId, GroupId, Publisher, TimeStamp, Status',
      persons: '&TrxId, GroupId, Publisher, TimeStamp, Status',
    });
    this.objects = this.table('objects');
    this.persons = this.table('persons');

    this.version(2).stores({
      objectSummary: '&Publisher, GroupId, Count',
    });
    this.objectSummary = this.table('objectSummary');
  }
}

(window as any).db = new Database();

export enum ContentStatus {
  Synced = 'synced',
  Syncing = 'syncing',
}

interface IDbExtra {
  GroupId: string;
  Status: ContentStatus;
}

export interface IDbObjectItem extends IObjectItem, IDbExtra {}

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Person: IDbPersonItem | null;
}

export interface IDbObjectSummary {
  Publisher: string;
  GroupId: string;
  Count: number;
}

import Dexie from 'dexie';
import { IObjectItem, IPersonItem } from 'apis/group';

export default class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;

  constructor() {
    super('Database');
    this.version(1).stores({
      objects: '&TrxId, GroupId, Publisher, TimeStamp',
      persons: '&TrxId, GroupId, Publisher, TimeStamp',
    });
    this.objects = this.table('objects');
    this.persons = this.table('persons');
  }
}

export interface IDbObjectItem extends IObjectItem {
  GroupId: string;
}

export interface IDbPersonItem extends IPersonItem {
  GroupId: string;
}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Person?: IDbPersonItem;
}

const db = new Database();
(window as any).db = db;

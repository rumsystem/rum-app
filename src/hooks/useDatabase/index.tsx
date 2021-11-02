import Dexie from 'dexie';
import { useStore } from 'store';
import {
  IObjectItem,
  IPersonItem,
  IFollowItem,
  ContentTypeUrl,
} from 'apis/group';

let database = null as Database | null;

export default () => {
  const { nodeStore } = useStore();
  if (!database) {
    database = new Database(nodeStore.info.node_publickey);
  }
  return database as Database;
};

export class Database extends Dexie {
  objects: Dexie.Table<IDbObjectItem, number>;
  persons: Dexie.Table<IDbPersonItem, number>;
  summary: Dexie.Table<IDbSummary, number>;

  constructor(nodePublickey: string) {
    super(`Database_${nodePublickey}`);
    this.version(1).stores({
      objects: '++Id, TrxId, GroupId, Status, Publisher',
      persons: '++Id, TrxId, GroupId, Status, Publisher',
      summary: '++Id, GroupId, Publisher, TypeUrl, Count',
    });
    this.objects = this.table('objects');
    this.persons = this.table('persons');
    this.summary = this.table('summary');
  }
}

(window as any).Database = Database;

export enum ContentStatus {
  Synced = 'synced',
  Syncing = 'syncing',
}

interface IDbExtra {
  Id?: number;
  GroupId: string;
  Status: ContentStatus;
}

export interface IDbObjectItem extends IObjectItem, IDbExtra {}

export interface IDbPersonItem extends IPersonItem, IDbExtra {}

export interface IDbFollowItem extends IFollowItem, IDbExtra {
  Following: string;
}

export interface IDbDerivedObjectItem extends IDbObjectItem {
  Person: IDbPersonItem | null;
  Summary?: IDbSummary | null;
}

export interface IDbSummary {
  Publisher: string;
  GroupId: string;
  TypeUrl: ContentTypeUrl;
  Count: number;
}

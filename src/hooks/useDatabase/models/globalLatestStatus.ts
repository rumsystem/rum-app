import Database from 'hooks/useDatabase/database';

export interface IGlobalLatestStatus {
  latestObjectId: number
  latestPersonId: number
  latestCommentId: number
}

export interface IGlobalLatestStatusPayload {
  latestObjectId?: number
  latestPersonId?: number
  latestCommentId?: number
}

export const DEFAULT_LATEST_STATUS = {
  latestObjectId: 0,
  latestPersonId: 0,
  latestCommentId: 0,
};

export interface IDBGlobalLatestStatus {
  Id: number
  Status: IGlobalLatestStatus
}

export const createOrUpdate = async (db: Database, status: IGlobalLatestStatusPayload) => {
  const whereQuery = {
    Id: 1,
  };
  const exist = await db.globalLatestStatus.get(whereQuery);
  if (exist) {
    await db.globalLatestStatus.where(whereQuery).modify({
      Status: {
        ...exist.Status,
        ...status,
      },
    });
  } else {
    await db.globalLatestStatus.put({
      Id: 1,
      Status: {
        ...DEFAULT_LATEST_STATUS,
        ...status,
      },
    } as IDBGlobalLatestStatus);
  }
};

export const get = async (db: Database) => {
  const whereQuery = {
    Id: 1,
  };
  const globalLatestStatus = await db.globalLatestStatus.get(whereQuery);
  return globalLatestStatus || {
    Id: 1,
    Status: DEFAULT_LATEST_STATUS,
  } as IDBGlobalLatestStatus;
};

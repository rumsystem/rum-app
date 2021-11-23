import Database from 'hooks/useDatabase/database';
import { IContentItemBasic, IObject, IPerson, IVote } from 'apis/content';

export interface IDbContentItem extends IContentItemBasic {
  Id?: number
  GroupId: string
  Content: IObject | IPerson | IVote
}

export const bulkCreate = async (db: Database, contents: Array<IDbContentItem>) => {
  await db.contents.bulkAdd(contents);
};

export const count = async (db: Database) => {
  const count = await db.contents.count();
  return count;
};

export const get = async (db: Database, options: {
  GroupId: string
  Publisher: string
  TypeUrl: string
}) => {
  const content = db.contents.where({
    GroupId: options.GroupId,
    Publisher: options.Publisher,
    TypeUrl: options.TypeUrl,
  }).first();
  return content;
};

export const list = async (db: Database, options: {
  limit: number
  TypeUrl?: string
  startId?: number
}) => {
  let collection = db.contents.toCollection();

  if (
    options.startId || options.TypeUrl
  ) {
    collection = collection.and(
      (content) => {
        const conditions = [
          !options.startId || (content.Id || 0) > options.startId,
          !options.TypeUrl || content.TypeUrl === options.TypeUrl,
        ];
        return conditions.every(Boolean);
      },
    );
  }

  const result = await db.transaction(
    'r',
    [db.contents],
    async () => {
      const objects = await collection
        .limit(options.limit || 10)
        .sortBy('Id');

      return objects;
    },
  );

  return result;
};

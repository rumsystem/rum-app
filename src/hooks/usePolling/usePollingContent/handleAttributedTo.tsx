import { INoteItem } from 'apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as AttributedToModel from 'hooks/useDatabase/models/attributedTo';

interface IOptions {
  groupId: string
  objects: INoteItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects } = options;

  if (objects.length === 0) {
    return;
  }

  try {
    await database.transaction(
      'rw',
      [
        database.attributedTo,
      ],
      async () => {
        const existAttributedTos = await AttributedToModel.bulkGet(database, objects.map((v) => v.TrxId));
        const items = objects.map((object, i) => ({ object, existAttributedTo: existAttributedTos[i] }));

        const itemsToAdd: Array<AttributedToModel.IDbAttributedToItemPayload> = [];
        items.filter((v) => !v.existAttributedTo).forEach(({ object }) => {
          itemsToAdd.push({
            ...object,
            GroupId: groupId,
            Status: ContentStatus.synced,
          });
        });

        AttributedToModel.bulkAdd(database, itemsToAdd);
      },
    );
  } catch (e) {
    console.error(e);
  }
};

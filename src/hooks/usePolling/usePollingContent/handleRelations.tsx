import type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';
import { Store } from 'store';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as RelationSummaryModel from 'hooks/useDatabase/models/relationSummaries';
import * as RelationModel from 'hooks/useDatabase/models/relations';
import { RelationType } from 'utils/contentDetector';

interface IOptions {
  groupId: string
  objects: IContentItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { database, groupId, objects, store } = options;
  const { relationStore } = store;
  if (objects.length === 0) { return; }

  try {
    await database.transaction(
      'rw',
      [database.relations, database.relationSummaries],
      async () => {
        const items = objects.map((v) => ({
          content: v,
          activity: v.Content as any as RelationType,
        }));

        const itemsToPut: Array<RelationModel.IDBRelation> = [];
        const getSummaryMapKey = (
          from: string,
          to: string,
          type: RelationSummaryModel.IDBRelationSummary['type'],
        ) => [from, to, type].join('-');
        const summaryMap = new Map<string, RelationSummaryModel.IDBRelationSummary>();

        const existedRelations = await RelationModel.bulkGet(
          database,
          items.map((v) => ({
            groupId,
            trxId: v.content.TrxId,
          })),
        );

        for (const item of items) {
          const existedRelation = existedRelations.find(
            (v) => [
              v?.trxId === item.content.TrxId,
              v.publisher === item.content.Publisher,
              v.status === ContentStatus.syncing,
            ].every(Boolean),
          );
          if (existedRelation) {
            existedRelation.status = ContentStatus.synced;
            itemsToPut.push(existedRelation);
            continue;
          }
          const from = item.content.Publisher;
          const to = item.activity.type === 'Undo'
            ? item.activity.object.object.id
            : item.activity.object.id;
          const type: RelationModel.IDBRelation['type'] = item.activity.type === 'Undo'
            ? ({ Follow: 'undofollow', Block: 'undoblock' } as const)[item.activity.object.type]
            : ({ Follow: 'follow', Block: 'block' } as const)[item.activity.type];
          const summaryType: RelationModel.IDBRelation['type'] = item.activity.type === 'Undo'
            ? ({ Follow: 'follow', Block: 'block' } as const)[item.activity.object.type]
            : ({ Follow: 'follow', Block: 'block' } as const)[item.activity.type];
          itemsToPut.push({
            groupId,
            trxId: item.content.TrxId,
            from,
            to,
            type,
            publisher: item.content.Publisher,
            timestamp: item.content.TimeStamp,
            status: ContentStatus.synced,
          });
          summaryMap.set(
            getSummaryMapKey(from, to, summaryType),
            {
              groupId,
              from,
              to,
              type: summaryType,
              value: !type.startsWith('undo'),
            },
          );
        }
        const summariesToPut = Array.from(summaryMap.values());
        await Promise.all([
          RelationModel.bulkPut(database, itemsToPut),
          RelationSummaryModel.bulkPut(database, summariesToPut),
        ]);
        relationStore.addRelations(summariesToPut);
      },
    );
  } catch (e) {
    console.error(e);
  }
};

import * as RelationSummaryModel from 'hooks/useDatabase/models/relationSummaries';

const getRelationSummaryKey = (v: RelationSummaryModel.IDBRelationSummary) => [
  v.groupId, v.from, v.to, v.type,
].join('-');

export function createRelationStore() {
  return {
    relationMap: new Map<string, RelationSummaryModel.IDBRelationSummary>(),

    get byGroupId() {
      return Array.from(this.relationMap.values()).reduce((p, c) => {
        const arr = p.get(c.groupId) ?? [];
        arr.push(c);
        p.set(c.groupId, arr);
        return p;
      }, new Map<string, Array<RelationSummaryModel.IDBRelationSummary>>());
    },

    addRelations(items: Array<RelationSummaryModel.IDBRelationSummary>) {
      items.forEach((v) => {
        const key = getRelationSummaryKey(v);
        this.relationMap.set(key, v);
      });
    },
  };
}

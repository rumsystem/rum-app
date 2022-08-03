import Database from 'hooks/useDatabase/database';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as LikeModel from 'hooks/useDatabase/models/like';
import * as OverwriteMappingModel from 'hooks/useDatabase/models/overwriteMapping';

export default async (db: Database, options: {
  fromObject: ObjectModel.IDbObjectItem
  toObject: ObjectModel.IDbObjectItem
}) => {
  const { fromObject, toObject } = options;
  if (!fromObject || !toObject) {
    return;
  }
  await ObjectModel.put(db, toObject.TrxId, {
    ...toObject,
    Summary: fromObject.Summary,
  });
  await CommentModel.transferObjectTrxId(db, fromObject.TrxId, toObject.TrxId);
  await LikeModel.transferObjectTrxId(db, fromObject.TrxId, toObject.TrxId);
  await ObjectModel.remove(db, fromObject.TrxId);
  await OverwriteMappingModel.bulkPut(db, [
    {
      fromTrxId: fromObject.TrxId,
      toTrxId: toObject.TrxId,
    },
  ]);
  await OverwriteMappingModel.updateHistoryToTrxId(db, fromObject.TrxId, toObject.TrxId);
};

import Dexie from 'dexie';

export const runPreviousMigrations = (db: Dexie) => {
  db.version(1).stores({
    posts: [
      '[groupId+id]',
      '[groupId+id+deleted]',
      '[groupId+trxId]',
      '[groupId+trxId+deleted]',
      '[groupId+publisher]',
      '[groupId+publisher+deleted]',
      'groupId',
      '[groupId+deleted]',
      '[groupId+timestamp]',
      '[groupId+summary.hotCount]',
    ].join(','),
    comments: [
      '[groupId+id]',
      '[groupId+id+deleted]',
      '[groupId+trxId]',
      '[groupId+trxId+deleted]',
      '[groupId+postId]',
      '[groupId+postId+deleted]',
      '[groupId+publisher]',
      '[groupId+publisher+deleted]',
      'groupId',
      '[groupId+postId+timestamp]',
      '[groupId+postId+summary.hotCount]',
    ].join(','),
    counters: [
      '[groupId+trxId]',
      '[groupId+publisher]',
      '[groupId+publisher+objectId]',
      'groupId',
    ].join(','),
    profiles: [
      '[groupId+trxId]',
      '[groupId+publisher]',
      '[groupId+trxId+timestamp]',
      '[groupId+publisher+timestamp]',
      'groupId',
      'trxId',
      'publisher',
    ].join(','),
    images: [
      '[groupId+id]',
      '[groupId+trxId]',
      'id',
      'trxId',
      'groupId',
      'publisher',
    ].join(','),
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Status]',
      '[GroupId+Type]',
      '[GroupId+Type+Status]',
    ].join(','),
    summary: [
      '++Id',
      'GroupId',
      'ObjectId',
      'ObjectType',
      'Count',
      '[GroupId+ObjectType]',
      '[GroupId+ObjectType+ObjectId]',
    ].join(','),
    transfers: [
      '++Id',
      'uuid',
      'to',
      'from',
    ].join(','),
    relations: [
      '[groupId+trxId]',
      '[groupId+publisher]',
      '[groupId+type+from+to]',
      'groupId',
    ].join(','),
    relationSummaries: [
      '[groupId+type+from+to]',
      '[groupId+from]',
      '[groupId+to]',
      '[groupId+from+to]',
      '[groupId+type+from]',
      '[groupId+type+to]',
      'groupId',
    ].join(','),
    pendingTrx: [
      '++id',
      '[groupId+trxId]',
      'groupId',
    ].join(','),
    emptyTrx: [
      '[groupId+trxId]',
      'groupId',
    ].join(','),
  });

  db.version(2).stores({}).upgrade(async (tx) => {
    // fix timestamp conversion
    const tables = ['posts', 'comments', 'counters', 'profiles', 'images', 'relations', 'emptyTrx', 'notifications'] as const;
    for (const tableName of tables) {
      const table = tx.table(tableName);
      const timestampKey = tableName === 'notifications' ? 'TimeStamp' : 'timestamp';
      const items = await table.toArray();
      for (const item of items) {
        const timestamp = item[timestampKey];
        if (timestamp && timestamp > 10 ** 14) {
          await table
            .where({ groupId: item.groupId, trxId: item.trxId })
            .modify({ [timestampKey]: timestamp / 1000000 });
        }
      }
    }
  });
};

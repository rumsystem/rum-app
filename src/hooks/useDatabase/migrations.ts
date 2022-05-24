import Dexie from 'dexie';
import { groupBy } from 'lodash';
import getHotCount from './models/relations/getHotCount';
import electronCurrentNodeStore from 'store/electronCurrentNodeStore';

export const runPreviousMigrations = (db: Dexie, nodePublickey: string) => {
  const contentBasicIndex = [
    '++Id',
    'TrxId',
    'GroupId',
    'Status',
    'Publisher',
  ];

  db.version(11).stores({
    objects: [
      ...contentBasicIndex,
      'commentCount',
      '[GroupId+Publisher]',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'commentCount',
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
    ].join(','),
    votes: [
      ...contentBasicIndex,
      'Content.type',
      'Content.objectTrxId',
      'Content.objectType',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    const comments = await tx.table('comments').toArray();
    const groupedComments = groupBy(comments, (comment) => comment.Content.objectTrxId);
    const objectTrxIds = Object.keys(groupedComments);
    const objects = await tx.table('objects').where('TrxId').anyOf(objectTrxIds).toArray();
    const objectsToPut = objects.map((object) => ({
      ...object,
      commentCount: groupedComments[object.TrxId].length,
    }));
    await tx.table('objects').bulkPut(objectsToPut);
  });

  db.version(16).stores({
    objects: [
      ...contentBasicIndex,
      'commentCount',
      'likeCount',
      '[GroupId+Publisher]',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'commentCount',
      'likeCount',
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId+Content.type]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    await tx.table('notifications').toCollection().delete();
    const latestStatusList = await tx.table('latestStatus').toArray();
    const latestStatusListToPut = latestStatusList.map((item) => {
      item.Status.notificationUnreadCountMap = {};
      return item;
    });
    if (latestStatusListToPut.length > 0) {
      await tx.table('latestStatus').bulkPut(latestStatusListToPut);
    }
  });

  db.version(17).stores({
    objects: [
      ...contentBasicIndex,
      'commentCount',
      'likeCount',
      '[GroupId+Publisher]',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'commentCount',
      'likeCount',
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId+Content.type]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    try {
      await tx.table('objects').toCollection().filter((object) => ['Like', 'Dislike'].includes(object.Content.type)).delete();
    } catch (e) {
      console.log(e);
    }
  });

  db.version(25).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    try {
      const objects = await tx.table('objects').toArray();
      const newObjects = objects.map((object) => {
        const hotCount = getHotCount({
          likeCount: Math.max(object.likeCount || 0, 0),
          dislikeCount: Math.max(object.dislikeCount || 0, 0),
          commentCount: Math.max(object.commentCount || 0, 0),
        });
        object.Summary = {
          hotCount,
          commentCount: Math.max(object.commentCount || 0, 0),
          likeCount: Math.max(object.likeCount || 0, 0),
          dislikeCount: Math.max(object.dislikeCount || 0, 0),
        };
        return object;
      });
      await tx.table('objects').bulkPut(newObjects);

      const comments = await tx.table('comments').toArray();
      const newComments = comments.map((comment) => {
        const hotCount = getHotCount({
          likeCount: Math.max(comment.likeCount || 0, 0),
          dislikeCount: Math.max(comment.dislikeCount || 0, 0),
          commentCount: Math.max(comment.commentCount || 0, 0),
        });
        comment.Summary = {
          hotCount,
          commentCount: Math.max(comment.commentCount || 0, 0),
          likeCount: Math.max(comment.likeCount || 0, 0),
          dislikeCount: Math.max(comment.dislikeCount || 0, 0),
        };
        return comment;
      });
      await tx.table('comments').bulkPut(newComments);
    } catch (e) {
      console.log(e);
    }
  });

  db.version(29).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    attributedTo: [
      ...contentBasicIndex,
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    try {
      const collection = tx.table('objects').toCollection().filter((object) => 'attributedTo' in object.Content);
      const attributedToItems = await collection.toArray();
      if (attributedToItems.length > 0) {
        await collection.delete();
        await tx.table('attributedTo').bulkAdd(attributedToItems);
      }
    } catch (e) {
      console.log(e);
    }
  });

  db.version(30).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    attributedTo: [
      ...contentBasicIndex,
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    latestStatus: ['++Id', 'GroupId'].join(','),
    globalLatestStatus: ['++Id'].join(','),
  }).upgrade(async (tx) => {
    try {
      electronCurrentNodeStore.init(nodePublickey);
      const store = electronCurrentNodeStore.getStore();
      if (!store) {
        throw new Error('current node store is not inited');
      }
      const _latestStatus = await tx.table('latestStatus').toArray();
      const latestStatus = _latestStatus.map((item) => ({
        groupId: item.GroupId,
        ...item.Status,
      }));
      console.log({ _latestStatus, latestStatus });
      store.set('latestStatus', latestStatus);
    } catch (e) {
      console.log(e);
    }
  });

  db.version(32).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    attributedTo: [
      ...contentBasicIndex,
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
  }).upgrade(async (tx) => {
    try {
      await removeDuplicatedData(tx.table('objects'));
      await removeDuplicatedData(tx.table('persons'));
      await removeDuplicatedData(tx.table('comments'));
      await removeDuplicatedData(tx.table('likes'));
      await removeDuplicatedData(tx.table('attributedTo'));
    } catch (e) {
      console.log(e);
    }
  });

  async function removeDuplicatedData(table: any) {
    try {
      const items = await table.toArray();
      const trxIdSet = new Set();
      const removedIds = [];
      for (const item of items) {
        if (trxIdSet.has(item.TrxId)) {
          removedIds.push(item.Id);
        } else {
          trxIdSet.add(item.TrxId);
        }
      }
      console.log({
        items,
        removedIds,
      });
      await table.where('Id').anyOf(removedIds).delete();
    } catch (e) {
      console.log(e);
    }
  }

  db.version(33).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    attributedTo: [
      ...contentBasicIndex,
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    overwriteMapping: [
      '++Id',
      'fromTrxId',
      'toTrxId',
    ].join(','),
  });

  db.version(35).stores({
    objects: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Summary.hotCount]',
      '[GroupId+TimeStamp]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    persons: [
      ...contentBasicIndex,
      '[GroupId+Publisher]',
      '[GroupId+Publisher+Status]',
    ].join(','),
    comments: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.replyTrxId',
      'Content.threadTrxId',
      '[GroupId+Publisher]',
      '[GroupId+Content.objectTrxId]',
      '[Content.threadTrxId+Content.objectTrxId]',
      '[GroupId+Content.objectTrxId+Summary.hotCount]',
      'Summary.commentCount',
      'Summary.likeCount',
      'Summary.dislikeCount',
      'Summary.hotCount',
    ].join(','),
    attributedTo: [
      ...contentBasicIndex,
    ].join(','),
    likes: [
      ...contentBasicIndex,
      'Content.objectTrxId',
      'Content.type',
      '[Publisher+Content.objectTrxId]',
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
    notifications: [
      '++Id',
      'GroupId',
      'Type',
      'Status',
      'ObjectTrxId',
      '[GroupId+Type+Status]',
    ].join(','),
    overwriteMapping: [
      '++Id',
      'fromTrxId',
      'toTrxId',
    ].join(','),
  });
};

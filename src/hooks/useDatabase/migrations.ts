import Dexie from 'dexie';
import { groupBy } from 'lodash';

export const runPreviousMigrations = (db: Dexie) => {
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
};

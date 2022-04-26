import Database, { IDbExtra } from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { IVoteItem, IVoteObjectType, IVoteType } from 'apis/content';
import * as SummaryModel from 'hooks/useDatabase/models/summary';

export interface IDbVoteItem extends IVoteItem, IDbExtra {}

export const create = async (db: Database, vote: IDbVoteItem) => {
  const existVote = await get(db, {
    Publisher: vote.Publisher,
    objectTrxId: vote.Content.objectTrxId,
    objectType: vote.Content.objectType,
  });
  if (existVote) {
    await syncSummary(db, existVote);
    return;
  }
  await db.votes.add(vote);
  await syncSummary(db, vote);
};

export const get = async (
  db: Database,
  options: {
    Publisher: string
    objectTrxId: string
    objectType: string
  },
) => {
  const vote = await db.votes.get({
    Publisher: options.Publisher,
    'Content.type': IVoteType.up,
    'Content.objectTrxId': options.objectTrxId,
    'Content.objectType': options.objectType,
  });
  if (!vote) {
    return null;
  }
  return vote;
};

const syncSummary = async (db: Database, vote: IDbVoteItem) => {
  let ObjectType = '' as SummaryModel.SummaryObjectType;
  if (vote.Content.objectType === IVoteObjectType.object) {
    ObjectType = SummaryModel.SummaryObjectType.objectUpVote;
  } else if (vote.Content.objectType === IVoteObjectType.comment) {
    ObjectType = SummaryModel.SummaryObjectType.CommentUpVote;
  } else {
    console.error('unknow vote object type');
    return;
  }
  const count = await db.votes
    .where({
      GroupId: vote.GroupId,
      'Content.type': vote.Content.type,
      'Content.objectTrxId': vote.Content.objectTrxId,
      'Content.objectType': vote.Content.objectType,
    })
    .count();
  await SummaryModel.createOrUpdate(db, {
    GroupId: vote.GroupId,
    ObjectId: vote.Content.objectTrxId,
    ObjectType,
    Count: count,
  });
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string
  },
) => {
  await db.votes.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
};

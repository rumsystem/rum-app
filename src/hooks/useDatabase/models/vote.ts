import {
  Database,
  IDbVoteItem,
  ContentStatus,
  SummaryObjectType,
} from 'hooks/useDatabase';
import { IVoteObjectType, IVoteType } from 'apis/group';

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
    Publisher: string;
    objectTrxId: string;
    objectType: string;
  }
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

export const getSummaryVoteCount = async (
  db: Database,
  whereOptions: {
    ObjectId: string;
    ObjectType: SummaryObjectType;
  }
) => {
  const summary = await db.summary.get(whereOptions);
  return summary ? summary.Count : 0;
};

const syncSummary = async (db: Database, vote: IDbVoteItem) => {
  const summaryQuery = {
    ObjectId: vote.Content.objectTrxId,
    ObjectType: '' as SummaryObjectType,
  };
  if (vote.Content.objectType === IVoteObjectType.object) {
    summaryQuery.ObjectType = SummaryObjectType.objectUpVote;
  } else if (vote.Content.objectType === IVoteObjectType.comment) {
    summaryQuery.ObjectType = SummaryObjectType.CommentUpVote;
  } else {
    console.error('unknow vote object type');
    return;
  }
  const count = await db.votes
    .where({
      'Content.type': vote.Content.type,
      'Content.objectTrxId': vote.Content.objectTrxId,
      'Content.objectType': vote.Content.objectType,
    })
    .count();
  const existSummary = await db.summary.get(summaryQuery);
  if (existSummary) {
    await db.summary.where(summaryQuery).modify({
      Count: count,
    });
  } else {
    await db.summary.add({
      ...summaryQuery,
      GroupId: vote.GroupId,
      Count: count,
    });
  }
};

export const markedAsSynced = async (
  db: Database,
  whereOptions: {
    TrxId: string;
  }
) => {
  await db.votes.where(whereOptions).modify({
    Status: ContentStatus.synced,
  });
};

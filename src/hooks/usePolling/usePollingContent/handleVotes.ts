import { IVoteItem } from 'apis/content';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as VoteModel from 'hooks/useDatabase/models/vote';

interface IOptions {
  groupId: string
  votes: IVoteItem[]
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, votes, database } = options;

  if (votes.length === 0) {
    return;
  }

  for (const vote of votes) {
    try {
      await VoteModel.create(database, {
        ...vote,
        GroupId: groupId,
        Status: ContentStatus.synced,
      });
    } catch (err) {
      console.log(err);
    }
  }
};

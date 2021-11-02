import { ICommentItem } from 'apis/group';
import { Database, ContentStatus } from 'hooks/useDatabase';
import * as CommentModel from 'hooks/useDatabase/models/comment';

interface IOptions {
  groupId: string;
  comments: ICommentItem[];
  database: Database;
}

export default async (options: IOptions) => {
  const { groupId, comments, database } = options;

  if (comments.length === 0) {
    return;
  }

  for (const comment of comments) {
    try {
      await CommentModel.create(database, {
        ...comment,
        GroupId: groupId,
        Status: ContentStatus.synced,
      });
    } catch (err) {
      console.log(err);
    }
  }
};

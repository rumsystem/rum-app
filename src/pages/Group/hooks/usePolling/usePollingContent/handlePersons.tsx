import { IPersonItem } from 'apis/group';
import Database, { ContentStatus } from 'store/database';

export default async (groupId: string, persons: IPersonItem[] = []) => {
  if (persons.length === 0) {
    return;
  }

  const db = new Database();
  for (const person of persons) {
    try {
      const syncingPerson = await db.persons.get({
        TrxId: person.TrxId,
      });

      if (syncingPerson) {
        await db.persons
          .where({
            GroupId: groupId,
            TrxId: person.TrxId,
          })
          .modify({
            Status: ContentStatus.Synced,
          });
        continue;
      }

      await db.persons.add({
        ...person,
        GroupId: groupId,
        Status: ContentStatus.Synced,
      });
    } catch (err) {
      console.log(err);
    }
  }
};

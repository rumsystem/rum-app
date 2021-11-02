import { IPersonItem } from 'apis/group';
import { Database, ContentStatus } from 'hooks/useDatabase';
import { Store } from 'store';

interface IOptions {
  groupId: string;
  persons: IPersonItem[];
  store: Store;
  database: Database;
}

export default async (options: IOptions) => {
  const { groupId, persons, store, database } = options;

  if (persons.length === 0) {
    return;
  }

  const db = database;
  for (const person of persons) {
    try {
      const existPerson = await db.persons.get({
        TrxId: person.TrxId,
      });

      if (existPerson && existPerson.Status === ContentStatus.Synced) {
        continue;
      }

      if (existPerson) {
        await db.persons
          .where({
            GroupId: groupId,
            TrxId: person.TrxId,
          })
          .modify({
            ...person,
            Status: ContentStatus.Synced,
          });
        continue;
      }

      const dbPerson = {
        ...person,
        GroupId: groupId,
        Status: ContentStatus.Synced,
      };
      await db.persons.add(dbPerson);

      if (
        groupId === store.activeGroupStore.id &&
        person.Publisher === store.nodeStore.info.node_publickey
      ) {
        store.activeGroupStore.setPerson(dbPerson);
      }
    } catch (err) {
      console.log(err);
    }
  }
};

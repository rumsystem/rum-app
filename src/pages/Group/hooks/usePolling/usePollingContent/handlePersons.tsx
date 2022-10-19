import { IPersonItem } from 'apis/group';
import Database, { ContentStatus } from 'store/database';
import { Store } from 'store';

export default async (
  groupId: string,
  persons: IPersonItem[] = [],
  store: Store
) => {
  if (persons.length === 0) {
    return;
  }

  const db = new Database();
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

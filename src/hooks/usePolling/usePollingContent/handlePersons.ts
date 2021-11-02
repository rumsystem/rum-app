import { IPersonItem } from 'apis/group';
import { Database } from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { Store } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';

interface IOptions {
  groupId: string
  persons: IPersonItem[]
  store: Store
  database: Database
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

      if (existPerson && existPerson.Status === ContentStatus.synced) {
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
            Status: ContentStatus.synced,
          });
        continue;
      }

      const dbPerson = {
        ...person,
        GroupId: groupId,
        Status: ContentStatus.synced,
      };
      await db.persons.add(dbPerson);

      if (
        groupId === store.activeGroupStore.id
        && person.Publisher === store.nodeStore.info.node_publickey
      ) {
        const user = await PersonModel.getUser(db, {
          GroupId: groupId,
          Publisher: person.Publisher,
        });
        store.activeGroupStore.setProfile(user.profile);
      }
    } catch (err) {
      console.log(err);
    }
  }
};

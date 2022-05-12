import { IPersonItem } from 'apis/group';
import Database from 'hooks/useDatabase/database';
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
      const existPerson = await PersonModel.get(db, {
        TrxId: person.TrxId,
      });

      if (existPerson && existPerson.Status !== ContentStatus.syncing) {
        continue;
      }

      if (existPerson) {
        await PersonModel.markedAsSynced(db, {
          TrxId: person.TrxId,
        });
      } else {
        await PersonModel.create(db, {
          ...person,
          GroupId: groupId,
          Status: ContentStatus.synced,
        });
      }

      if (
        groupId === store.activeGroupStore.id
      ) {
        const user = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: person.Publisher,
        });
        store.activeGroupStore.updateProfileMap(person.Publisher, user.profile);
        if (person.Publisher === store.nodeStore.info.node_publickey) {
          const latestPersonStatus = await PersonModel.getLatestPersonStatus(database, {
            GroupId: groupId,
            Publisher: person.Publisher,
          });
          store.activeGroupStore.setProfile(user.profile);
          store.activeGroupStore.setLatestPersonStatus(latestPersonStatus);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};
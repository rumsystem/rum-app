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
  const { groupStore, activeGroupStore } = store;

  if (persons.length === 0) {
    return;
  }

  try {
    await database.transaction(
      'rw',
      [
        database.summary,
        database.persons,
      ],
      async () => {
        const personsToCreate: Array<PersonModel.IDbPersonItem> = [];
        const activeGroup = groupStore.map[activeGroupStore.id];
        const myPublicKey = (activeGroup || {}).user_pubkey;
        const existedPersons = await PersonModel.bulkGet(database, persons.map((v) => v.TrxId));
        const items = persons.map((person, i) => ({
          person,
          existedPerson: existedPersons[i],
        }));

        items.filter((v) => !v.existedPerson).forEach(({ person }) => {
          personsToCreate.push({
            ...person,
            GroupId: groupId,
            Status: ContentStatus.synced,
          });
        });

        const personIdsToMarkedAsSynced = items
          .filter((v) => v.existedPerson && v.existedPerson.Status !== ContentStatus.syncing)
          .map((v) => v.person.TrxId);

        await PersonModel.bulkCreate(database, personsToCreate);
        await PersonModel.bulkMarkedAsSynced(database, personIdsToMarkedAsSynced);

        if (groupId === store.activeGroupStore.id) {
          const users = await PersonModel.getUsers(database, items.map((v) => ({
            GroupId: groupId,
            Publisher: v.person.Publisher,
          })));
          const zippedItems = items.map((v, i) => ({
            ...v,
            user: users[i],
          }));
          zippedItems.forEach(({ person, user }) => {
            store.activeGroupStore.updateProfileMap(person.Publisher, user.profile);
          });
          const myPersons = zippedItems.filter((v) => v.person.Publisher === myPublicKey);
          const last = myPersons[myPersons.length - 1];
          if (last) {
            const latestPersonStatus = await PersonModel.getLatestPersonStatus(database, {
              GroupId: groupId,
              Publisher: myPublicKey,
            });
            store.activeGroupStore.setProfile(last.user.profile);
            store.activeGroupStore.setLatestPersonStatus(latestPersonStatus);
          }
        }
      },
    );
  } catch (e) {
    console.error(e);
  }
};

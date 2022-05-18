import { IPersonItem } from 'apis/content';
import Database from 'hooks/useDatabase/database';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { Store } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { unionBy, keyBy } from 'lodash';
import { runInAction } from 'mobx';

interface IOptions {
  groupId: string
  persons: IPersonItem[]
  store: Store
  database: Database
}

export default async (options: IOptions) => {
  const { groupId, store, database } = options;
  const { activeGroupStore, groupStore } = store;
  const persons = unionBy(options.persons || [], (person) => person.Publisher);

  if (persons.length === 0) {
    return;
  }

  const db = database;

  await database.transaction(
    'rw',
    [
      database.summary,
      database.persons,
    ],
    async () => {
      const personTrxIds = persons.map((person) => person.TrxId);
      const existPersons = await PersonModel.bulkGetByTrxIds(db, personTrxIds);
      const existPersonMap = keyBy(existPersons, (person) => person.TrxId);
      const personsToPut = [] as PersonModel.IDbPersonItem[];

      for (const person of persons) {
        const existPerson = existPersonMap[person.TrxId];

        if (existPerson && existPerson.Status !== ContentStatus.syncing) {
          continue;
        }

        if (existPerson) {
          personsToPut.push({
            ...existPerson,
            Status: ContentStatus.synced,
          });
        } else {
          personsToPut.push({
            ...person,
            GroupId: groupId,
            Status: ContentStatus.synced,
          });
        }
      }

      await PersonModel.bulkPut(db, personsToPut);

      runInAction(() => {
        for (const person of personsToPut) {
          const profile = PersonModel.getProfile(person.Publisher, person);
          if (groupId === store.activeGroupStore.id) {
            activeGroupStore.updateProfileMap(person.Publisher, profile);
            const activeGroup = groupStore.map[activeGroupStore.id];
            const myPublicKey = (activeGroup || {}).user_pubkey;
            if (person.Publisher === myPublicKey) {
              activeGroupStore.setProfile(profile);
              groupStore.updateProfile(database, groupId);
            }
          } else {
            activeGroupStore.tryUpdateCachedProfileMap(groupId, person.Publisher, profile);
            const myPublicKey = (groupStore.map[groupId] || {}).user_pubkey;
            if (person.Publisher === myPublicKey) {
              groupStore.updateProfile(database, groupId);
            }
          }
        }
      });
    },
  );
};

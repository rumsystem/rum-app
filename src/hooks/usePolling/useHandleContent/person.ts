import React from 'react';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import {
  ContentTypeUrl,
} from 'apis/content';
import * as ContentModel from 'hooks/useDatabase/models/content';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as globalLatestStatusModel from 'hooks/useDatabase/models/globalLatestStatus';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { pick, unionBy, keyBy } from 'lodash';
import { runInAction } from 'mobx';

const LIMIT = 100;

const contentToPerson = (content: ContentModel.IDbContentItem) => pick(content, [
  'GroupId',
  'TrxId',
  'Publisher',
  'TypeUrl',
  'TimeStamp',
  'Content',
]) as PersonModel.IDbPersonItem;

export default (duration: number) => {
  const { groupStore, nodeStore, activeGroupStore } = useStore();
  const db = useDatabase();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(8000);
      while (!stop && !nodeStore.quitting) {
        await handle();
        await sleep(duration);
      }
    })();

    async function handle() {
      try {
        const globalLatestStatus = await globalLatestStatusModel.get(db);
        const { latestPersonId } = globalLatestStatus.Status;
        const contents = await ContentModel.list(db, {
          limit: LIMIT,
          TypeUrl: ContentTypeUrl.Person,
          startId: latestPersonId,
        });

        const persons = unionBy(contents.reverse(), (content) => `${content.GroupId}_${content.Publisher}`);

        if (persons.length === 0) {
          return;
        }

        console.log({ contents, persons, latestPersonId });

        await handleByGroup(persons.map(contentToPerson));

        const latestContent = contents[contents.length - 1];
        await globalLatestStatusModel.createOrUpdate(db, {
          latestPersonId: latestContent.Id,
        });
      } catch (err) {
        console.error(err);
      }
    }

    async function handleByGroup(persons: PersonModel.IDbPersonItem[]) {
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
            Status: ContentStatus.synced,
          });
        }

        console.log({ personsToPut });

        await PersonModel.bulkPut(db, personsToPut);

        const activeGroupPersonsToPut = personsToPut.filter((person) => person.GroupId === activeGroupStore.id);
        runInAction(() => {
          for (const person of activeGroupPersonsToPut) {
            const profile = PersonModel.getProfile(person.Publisher, person);
            activeGroupStore.updateProfileMap(person.Publisher, profile);
            const activeGroup = groupStore.map[activeGroupStore.id];
            const myPublicKey = (activeGroup || {}).user_pubkey;
            if (person.Publisher === myPublicKey) {
              activeGroupStore.setProfile(profile);
              activeGroupStore.setLatestPersonStatus(ContentStatus.synced);
            }
          }
        });
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

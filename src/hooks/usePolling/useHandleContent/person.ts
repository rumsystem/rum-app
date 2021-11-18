import React from 'react';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import {
  ContentTypeUrl,
  IPersonItem,
} from 'apis/content';
import * as ContentModel from 'hooks/useDatabase/models/content';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as globalLatestStatusModel from 'hooks/useDatabase/models/globalLatestStatus';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { groupBy, pick } from 'lodash';

const LIMIT = 100;

const contentToPerson = (content: ContentModel.IDbContentItem) => pick(content, [
  'TrxId',
  'Publisher',
  'TypeUrl',
  'TimeStamp',
  'Content',
]) as IPersonItem;

export default (duration: number) => {
  const { groupStore, nodeStore, activeGroupStore } = useStore();
  const database = useDatabase();

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
      const globalLatestStatus = await globalLatestStatusModel.get(database);
      const { latestPersonId } = globalLatestStatus.Status;
      const contents = await ContentModel.list(database, {
        limit: LIMIT,
        TypeUrl: ContentTypeUrl.Person,
        startId: latestPersonId,
      });
      const persons = contents;

      if (persons.length === 0) {
        return;
      }

      console.log({ persons });

      const groupedPersons = groupBy(persons, (person: ContentModel.IDbContentItem) => person.GroupId);

      if (groupedPersons[activeGroupStore.id]) {
        await handleByGroup(activeGroupStore.id, groupedPersons[activeGroupStore.id].map(contentToPerson));
        delete groupedPersons[activeGroupStore.id];
      }

      for (const groupId of Object.keys(groupedPersons)) {
        await handleByGroup(groupId, groupedPersons[groupId].map(contentToPerson));
      }

      const latestContent = contents[contents.length - 1];
      await globalLatestStatusModel.createOrUpdate(database, {
        latestPersonId: latestContent.Id,
      });
    }

    async function handleByGroup(groupId: string, persons: IPersonItem[]) {
      for (const person of persons) {
        try {
          const existPerson = await PersonModel.get(database, {
            TrxId: person.TrxId,
          });

          if (existPerson && existPerson.Status !== ContentStatus.syncing) {
            continue;
          }

          if (existPerson) {
            await PersonModel.markedAsSynced(database, {
              TrxId: person.TrxId,
            });
          } else {
            await PersonModel.create(database, {
              ...person,
              GroupId: groupId,
              Status: ContentStatus.synced,
            });
          }

          if (
            groupId === activeGroupStore.id
          ) {
            const user = await PersonModel.getUser(database, {
              GroupId: groupId,
              Publisher: person.Publisher,
            });
            activeGroupStore.updateProfileMap(person.Publisher, user.profile);
            const activeGroup = groupStore.map[activeGroupStore.id];
            const myPublicKey = (activeGroup || {}).user_pubkey;
            if (person.Publisher === myPublicKey) {
              const latestPersonStatus = await PersonModel.getLatestPersonStatus(database, {
                GroupId: groupId,
                Publisher: person.Publisher,
              });
              activeGroupStore.setProfile(user.profile);
              activeGroupStore.setLatestPersonStatus(latestPersonStatus);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};

import React from 'react';
import { GroupStatus } from 'apis/group';
import ContentApi, { ContentTypeUrl, IProfilePayload } from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { IProfile } from 'store/group';
import Base64 from 'utils/base64';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { useStore } from 'store';
import sleep from 'utils/sleep';

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();

  const submitPerson = React.useCallback(
    async (data: { groupId: string, publisher: string, profile: IProfile }) => {
      const payload = {
        type: 'Update',
        person: {
          name: data.profile.name,
        },
        target: {
          id: data.groupId,
          type: 'Group',
        },
      } as IProfilePayload;
      if (data.profile.avatar.startsWith('data')) {
        payload.person.image = {
          mediaType: Base64.getMimeType(data.profile.avatar),
          content: Base64.getContent(data.profile.avatar),
        };
      }
      if (data.profile.mixinUID) {
        payload.person.wallet = [{
          id: data.profile.mixinUID,
          type: 'mixin',
          name: 'mixin messenger',
        }];
      }

      for (let i = 0; i < 5 && groupStore.map[data.groupId].group_status !== GroupStatus.IDLE; i += 1) {
        await sleep(1000);
      }
      if (groupStore.map[data.groupId].group_status !== GroupStatus.IDLE) {
        return;
      }

      let res;
      try {
        res = await ContentApi.updateProfile(payload);
      } catch (e) {
        return;
      }
      const person = {
        GroupId: data.groupId,
        TrxId: res.trx_id,
        Publisher: data.publisher,
        Content: payload.person,
        TypeUrl: ContentTypeUrl.Person,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.syncing,
      };
      await PersonModel.create(database, person);
      activeGroupStore.setLatestPersonStatus(ContentStatus.syncing);
    },
    [],
  );

  return submitPerson;
};

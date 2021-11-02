import React from 'react';
import GroupApi, { ContentTypeUrl, IProfilePayload } from 'apis/group';
import useDatabase, { ContentStatus } from 'hooks/useDatabase';
import { IProfile } from 'store/group';
import Base64 from 'utils/base64';

export default () => {
  const database = useDatabase();

  const submitPerson = React.useCallback(
    async (data: { groupId: string; publisher: string; profile: IProfile }) => {
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
      const res = await GroupApi.updateProfile(payload);
      const person = {
        GroupId: data.groupId,
        TrxId: res.trx_id,
        Publisher: data.publisher,
        Content: payload.person,
        TypeUrl: ContentTypeUrl.Person,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.Syncing,
      };
      await database.persons.add(person);
      return person;
    },
    []
  );

  return submitPerson;
};

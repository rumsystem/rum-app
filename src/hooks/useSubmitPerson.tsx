import React from 'react';
import ContentApi, { ContentTypeUrl, IProfilePayload, IProfile } from 'apis/content';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import Base64 from 'utils/base64';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { useStore } from 'store';
import useCanIPost from 'hooks/useCanIPost';

export default () => {
  const { groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitPerson = React.useCallback(
    async (data: { groupId: string, publisher: string, profile: IProfile }, options?: {
      ignoreGroupStatus: boolean
    }) => {
      await canIPost(data.groupId, {
        ignoreGroupStatus: (options && options.ignoreGroupStatus) || false,
      });

      const payload = {
        type: 'Update',
        person: {},
        target: {
          id: data.groupId,
          type: 'Group',
        },
      } as IProfilePayload;
      if (data.profile.name) {
        payload.person.name = data.profile.name;
      }
      if (data.profile.avatar && data.profile.avatar.startsWith('data')) {
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
      groupStore.updateProfile(database, data.groupId);
    },
    [],
  );

  return submitPerson;
};

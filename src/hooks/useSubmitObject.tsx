import React from 'react';
import { useStore } from 'store';
import GroupApi, { ContentTypeUrl } from 'apis/group';
import { sleep } from 'utils';
import { ContentStatus } from 'hooks/useDatabase';
import useDatabase from 'hooks/useDatabase';

export default () => {
  const { activeGroupStore, nodeStore } = useStore();
  const database = useDatabase();

  const submitObject = React.useCallback(
    async (options: { content: string; delay?: number }) => {
      const { content, delay = 0 } = options;
      const payload = {
        type: 'Add',
        object: {
          type: 'Note',
          content,
          name: '',
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.postContent(payload);
      if (delay > 0) {
        await sleep(delay);
      }
      const object = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_publickey,
        Content: {
          type: payload.object.type,
          content: payload.object.content,
        },
        TypeUrl: ContentTypeUrl.Object,
        TimeStamp: Date.now() * 1000000,
        Status: ContentStatus.Syncing,
      };
      await database.objects.add(object);
      activeGroupStore.addObject(
        {
          ...object,
          Person: activeGroupStore.person,
        },
        {
          isFront: true,
        }
      );
    },
    []
  );

  return submitObject;
};

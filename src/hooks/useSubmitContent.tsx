import React from 'react';
import { useStore } from 'store';
import GroupApi, { ContentTypeUrl } from 'apis/group';
import { sleep } from 'utils';
import { queryObject } from 'store/database/selectors/object';

export default () => {
  const { activeGroupStore, nodeStore } = useStore();

  const startCheckJob = React.useCallback(async (trxId: string) => {
    let stop = false;
    let count = 1;
    while (!stop) {
      try {
        const syncedContent = await queryObject({
          groupId: activeGroupStore.id,
          trxId,
        });
        if (syncedContent) {
          activeGroupStore.addContent(syncedContent);
          activeGroupStore.deletePendingContents([trxId]);
          stop = true;
          continue;
        }
        if (count === 6) {
          stop = true;
          activeGroupStore.markAsFailed(trxId);
        } else {
          await sleep(Math.round(Math.pow(1.5, count) * 1000));
          count++;
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const submitContent = React.useCallback(
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
      activeGroupStore.setJustAddedContentTrxId(res.trx_id);
      if (delay > 0) {
        await sleep(delay);
      }
      const newContent = {
        GroupId: activeGroupStore.id,
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_publickey,
        Content: {
          type: payload.object.type,
          content: payload.object.content,
        },
        TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
        TimeStamp: Date.now() * 1000000,
        Publishing: true,
      };
      activeGroupStore.addContent(newContent);
      activeGroupStore.addPendingContent(newContent);
      startCheckJob(res.trx_id);
    },
    []
  );

  return submitContent;
};

import React from 'react';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import { sleep } from 'utils';

export default () => {
  const { activeGroupStore, groupStore, nodeStore } = useStore();

  const startCheckJob = React.useCallback(async (txId: string) => {
    let stop = false;
    let count = 1;
    while (!stop) {
      try {
        const contents = await GroupApi.fetchContents(activeGroupStore.id);
        const syncedContent =
          contents && contents.find((c) => c.TrxId === txId);
        if (syncedContent) {
          activeGroupStore.addContent(syncedContent);
          activeGroupStore.deletePendingContents([txId]);
          stop = true;
          if (
            syncedContent.TimeStamp >
            groupStore.latestContentTimeStampMap[activeGroupStore.id]
          ) {
            groupStore.setLatestContentTimeStamp(
              activeGroupStore.id,
              syncedContent.TimeStamp
            );
          }
          continue;
        }
        if (count === 6) {
          stop = true;
          activeGroupStore.markAsFailed(txId);
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
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_id,
        Content: {
          type: payload.object.type,
          content: payload.object.content,
        },
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

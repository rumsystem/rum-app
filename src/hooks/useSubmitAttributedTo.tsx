import React from 'react';
import { useStore } from 'store';
import ContentApi, { IImage, ContentTypeUrl, INotePayload } from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as AttributedToModel from 'hooks/useDatabase/models/attributedTo';
import useCanIPost from 'hooks/useCanIPost';

export interface ISubmitAttributedToPayload {
  content: string
  name?: string
  image?: IImage[]
  attributedTo: Array<Record<string, string>>
}

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitAttributedTo = React.useCallback(async (data: ISubmitAttributedToPayload) => {
    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];

    await canIPost(groupId);

    const payload: INotePayload = {
      type: 'Add',
      object: {
        type: 'Note',
        content: data.content,
        name: data.name || '',
        attributedTo: data.attributedTo,
      },
      target: {
        id: groupId,
        type: 'Group',
      },
    };
    if (data.image) {
      payload.object.image = data.image;
    }
    const res = await ContentApi.postNote(payload);
    await sleep(800);
    const attributedTo = {
      GroupId: groupId,
      TrxId: res.trx_id,
      Publisher: activeGroup.user_pubkey,
      Content: payload.object,
      TypeUrl: ContentTypeUrl.Object,
      TimeStamp: Date.now() * 1000000,
      Status: ContentStatus.syncing,
    };
    await AttributedToModel.bulkAdd(database, [attributedTo]);
    const [dbAttributedTo] = await AttributedToModel.bulkGet(database, [attributedTo.TrxId]);
    return dbAttributedTo;
  }, []);

  return submitAttributedTo;
};

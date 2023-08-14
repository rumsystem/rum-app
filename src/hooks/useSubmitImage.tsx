import React from 'react';
import { useStore } from 'store';
import ContentApi from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ImageModel from 'hooks/useDatabase/models/image';
import useCanIPost from 'hooks/useCanIPost';
import { ImageActivityType, ImageType } from 'utils/contentDetector';
import { v4 } from 'uuid';

export interface ISubmitImageToPayload {
  image: Omit<ImageType, 'type'>
}

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitImage = React.useCallback(async (data: ISubmitImageToPayload) => {
    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];

    await canIPost(groupId);

    const payload: ImageActivityType = {
      type: 'Create',
      object: {
        type: 'Image',
        id: v4(),
        content: data.image.content,
        mediaType: data.image.mediaType,
      },
    };
    const res = await ContentApi.postNote(payload, groupId);
    await sleep(800);
    const item: ImageModel.IDBImage = {
      id: payload.object.id,
      groupId,
      trxId: res.trx_id,
      content: payload.object.content,
      mediaType: payload.object.mediaType,
      publisher: activeGroup.user_pubkey,
      timestamp: Date.now() * 1000000,
      status: ContentStatus.syncing,
    };
    await ImageModel.add(database, item);
    return item;
  }, []);

  return submitImage;
};

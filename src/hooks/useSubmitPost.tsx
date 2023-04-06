import React from 'react';
import { useStore } from 'store';
import { v4 } from 'uuid';
import ContentApi from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PostModel from 'hooks/useDatabase/models/posts';
import { PreviewItem } from '@rpldy/upload-preview';
import useCanIPost from 'hooks/useCanIPost';
import { PostType } from 'utils/contentDetector';

export interface IPreviewItem extends PreviewItem {
  kbSize: number
}

export interface IDraft {
  content: string
  images?: IPreviewItem[]
}

export interface ISubmitObjectPayload {
  content: string
  name?: string
  image?: Array<{
    mediaType: string
    name: string
    content: string
  }>
}

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitObject = React.useCallback(async (
    data: ISubmitObjectPayload,
    options?: {
      delayForUpdateStore?: number
    },
  ) => {
    const groupId = activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];

    await canIPost(groupId);

    const id = v4();
    const payload: PostType = {
      type: 'Create',
      object: {
        type: 'Note',
        id,
        name: data.name ?? '',
        content: data.content,
        ...data.image ? { image: data.image.map((v) => ({ type: 'Image', ...v })) } : {},
      },
    };
    const res = await ContentApi.postNote(payload, groupId);
    await sleep(800);

    await PostModel.add(database, {
      id,
      trxId: res.trx_id,
      groupId,
      name: data.name ?? '',
      content: data.content,
      images: data.image,
      status: ContentStatus.syncing,
      deleted: 0,
      history: [],
      publisher: activeGroup.user_pubkey,
      timestamp: Date.now() * 1000000,
    });

    const post = (await PostModel.get(database, { groupId, id }))!;

    if (activeGroupStore.id === groupId) {
      setTimeout(() => {
        activeGroupStore.addPost(post, {
          isFront: true,
        });
      }, (options && options.delayForUpdateStore) || 0);
    }
  }, []);

  return submitObject;
};

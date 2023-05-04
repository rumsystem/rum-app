import React from 'react';
import { useStore } from 'store';
import { v4 } from 'uuid';
import ContentApi from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as PostModel from 'hooks/useDatabase/models/posts';
import useCanIPost from 'hooks/useCanIPost';
import { ImageType, PostType } from 'utils/contentDetector';

export interface ImageItem {
  url: string
  optimizedUrl: string
  optimizedSize: number
}

export interface IDraft {
  content: string
  images?: ImageItem[]
}

export interface ISubmitObjectPayload {
  content: string
  name?: string
  image?: Array<{
    mediaType: string
    content: string
  } | {
    url: string
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

    const images: Array<ImageType> = (data.image ?? []).map((v) => {
      if ('url' in v) {
        return {
          url: v.url,
          type: 'Image',
        };
      }
      return {
        content: v.content,
        mediaType: v.mediaType,
        type: 'Image',
      };
    });

    const payload: PostType = {
      type: 'Create',
      object: {
        type: 'Note',
        id,
        name: data.name ?? '',
        content: data.content,
        ...images.length ? { image: images } : {},
      },
      published: new Date().toISOString(),
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
      userAddress: activeGroup.user_eth_addr,
      timestamp: Date.now(),
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

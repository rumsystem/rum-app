import React from 'react';
import { useStore } from 'store';
import ContentApi, { ContentTypeUrl, IImage, INotePayload } from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useGroupStatusCheck from './useGroupStatusCheck';
import { PreviewItem } from '@rpldy/upload-preview';

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
  image?: IImage[]
}

export default () => {
  const { activeGroupStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const groupStatusCheck = useGroupStatusCheck();

  const submitObject = React.useCallback(async (data: ISubmitObjectPayload) => {
    const groupId = activeGroupStore.id;
    const canPostNow = groupStatusCheck(groupId);
    if (!canPostNow) {
      return;
    }

    const payload: INotePayload = {
      type: 'Add',
      object: {
        type: 'Note',
        content: data.content,
        name: data.name || '',
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
    const object = {
      GroupId: groupId,
      TrxId: res.trx_id,
      Publisher: activeGroup.user_pubkey,
      Content: payload.object,
      TypeUrl: ContentTypeUrl.Object,
      TimeStamp: Date.now() * 1000000,
      Status: ContentStatus.syncing,
    };
    await ObjectModel.create(database, object);
    const dbObject = await ObjectModel.get(database, {
      TrxId: object.TrxId,
    });
    if (dbObject && activeGroupStore.id === groupId) {
      activeGroupStore.addObject(dbObject, {
        isFront: true,
      });
    }
  }, []);

  return submitObject;
};

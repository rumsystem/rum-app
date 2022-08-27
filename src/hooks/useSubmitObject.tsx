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
import transferRelations from 'hooks/useDatabase/models/relations/transferRelations';
import ContentDetector from 'utils/contentDetector';

export interface IPreviewItem extends PreviewItem {
  kbSize: number
}

export interface IDraft {
  content: string
  images?: IPreviewItem[]
}

export interface ISubmitObjectPayload {
  content: string
  id?: string
  name?: string
  image?: IImage[]
}

export default () => {
  const { activeGroupStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const groupStatusCheck = useGroupStatusCheck();

  const submitObject = React.useCallback(async (data: ISubmitObjectPayload, options?: {
    delayForUpdateStore?: number
  }) => {
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
    if (data.id) {
      payload.object.id = data.id;
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

    // delete
    const isDeleteAction = ContentDetector.isDeleteAction(object);
    if (isDeleteAction && activeGroupStore.id === groupId) {
      await ObjectModel.remove(database, object.Content.id || '');
      activeGroupStore.deleteObject(data.id || '');
      return;
    }

    await ObjectModel.create(database, object);

    // update
    const isUpdateAction = ContentDetector.isUpdateAction(object);
    if (isUpdateAction) {
      const [fromObject, toObject] = await ObjectModel.bulkGet(database, [
        data.id || '',
        object.TrxId,
      ], {
        raw: true,
      });
      await transferRelations(database, {
        fromObject,
        toObject,
      });
    }

    const dbObject = (await ObjectModel.get(database, {
      TrxId: object.TrxId,
      currentPublisher: activeGroup.user_pubkey,
    }))!;

    if (activeGroupStore.id === groupId) {
      setTimeout(() => {
        activeGroupStore.addObject(dbObject, {
          isFront: true,
        });
        if (data.id) {
          activeGroupStore.deleteObject(data.id);
        }
      }, (options && options.delayForUpdateStore) || 0);
    }
  }, []);

  return submitObject;
};

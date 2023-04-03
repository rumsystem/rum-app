import React from 'react';
import { useStore } from 'store';
import ContentApi from 'apis/content';
import sleep from 'utils/sleep';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as RelationModel from 'hooks/useDatabase/models/relations';
import * as RelationSummaryModel from 'hooks/useDatabase/models/relationSummaries';
import { PreviewItem } from '@rpldy/upload-preview';
import useCanIPost from 'hooks/useCanIPost';
import { RelationType } from 'utils/contentDetector';
import { IDBRelation } from './useDatabase/models/relations';
import { runLoading } from 'utils/runLoading';

export interface IPreviewItem extends PreviewItem {
  kbSize: number
}

export interface IDraft {
  content: string
  images?: IPreviewItem[]
}

export interface ISubmitRelationPayload {
  groupId?: string
  to: string
  type: IDBRelation['type']
}

let loading = false;

export default () => {
  const { activeGroupStore, groupStore, relationStore } = useStore();
  const database = useDatabase();
  const canIPost = useCanIPost();

  const submitRelation = React.useCallback(async (data: ISubmitRelationPayload) => {
    const groupId = data.groupId ?? activeGroupStore.id;
    const activeGroup = groupStore.map[groupId];

    await canIPost(groupId);

    const id = data.to;
    const type = data.type === 'follow' || data.type === 'undofollow' ? 'Follow' : 'Block';
    const relationSummaryType = data.type === 'follow' || data.type === 'undofollow' ? 'follow' : 'block';
    const isUndo = data.type === 'undofollow' || data.type === 'undoblock';
    if (loading) { return; }

    relationStore.addRelations([{
      groupId,
      from: activeGroup.user_pubkey,
      to: data.to,
      type: relationSummaryType,
      value: !isUndo,
    }]);

    await runLoading(
      (l) => { loading = l; },
      async () => {
        const payload: RelationType = isUndo
          ? {
            type: 'Undo',
            object: {
              type,
              object: {
                type: 'Person',
                id,
              },
            },
          } : {
            type,
            object: {
              type: 'Person',
              id,
            },
          };
        const res = await ContentApi.postNote(payload, groupId);
        await sleep(800);

        await Promise.all([
          RelationModel.put(database, {
            groupId,
            trxId: res.trx_id,
            from: activeGroup.user_pubkey,
            to: data.to,
            publisher: activeGroup.user_pubkey,
            timestamp: Date.now() * 1000000,
            type: data.type,
            status: ContentStatus.syncing,
          }),
          RelationSummaryModel.put(database, {
            groupId,
            from: activeGroup.user_pubkey,
            to: data.to,
            type: relationSummaryType,
            value: !isUndo,
          }),
        ]);
      },
    );
  }, []);

  return submitRelation;
};

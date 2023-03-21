import useDatabase from 'hooks/useDatabase';
import * as EmptyTrxModel from 'hooks/useDatabase/models/emptyTrx';
import ContentApi from 'apis/content';
import { state } from './state';
import type { ContentTaskManager } from '../ContentTaskManager';

export class EmptyContentManager {
  public constructor(private contentTaskManager: ContentTaskManager) {}
  public async init() {
    const items = await EmptyTrxModel.getAll(useDatabase());
    state.items = items;
  }

  public async handleNewTrx(items: Array<{ groupId: string, trxId: string }>) {
    for (const item of items) {
      const hasEmptyTrx = state.items.some((v) => v.groupId === item.groupId && v.trxId === item.trxId);
      if (!hasEmptyTrx) { continue; }
      const contents = await ContentApi.fetchContents(item.groupId, {
        num: 1,
        starttrx: item.trxId,
        includestarttrx: true,
      });
      const content = contents?.[0];
      if (!content) { continue; }
      if (content.TrxId !== item.trxId) { return; }
      await this.contentTaskManager.handleContent(item.groupId, [content]);
      const index = state.items.findIndex((v) => v.groupId === item.groupId && v.trxId === item.trxId);
      state.items.splice(index, 1);
      await EmptyTrxModel.del(useDatabase(), { groupId: item.groupId, trxId: item.trxId });
    }
  }
}

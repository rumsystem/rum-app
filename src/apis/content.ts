import { qwasm } from 'utils/quorum-wasm/load-quorum';
import type { IContentItem, ICreateContentRes } from 'rum-fullnode-sdk/dist/apis/content';
import { getClient } from './client';

export type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';

export default {
  fetchContents(
    groupId: string,
    options: {
      num: number
      starttrx?: string
      nonce?: number
      reverse?: boolean
      includestarttrx?: boolean
    },
  ) {
    const normalizedOptions = {
      num: options.num,
      starttrx: options.starttrx ?? '',
      nonce: options.nonce ?? 0,
      reverse: options.reverse ?? false,
      includestarttrx: options.includestarttrx ?? false,
    };
    if (!process.env.IS_ELECTRON) {
      return qwasm.GetContent(
        groupId,
        normalizedOptions.num,
        normalizedOptions.starttrx,
        normalizedOptions.nonce,
        normalizedOptions.reverse,
        normalizedOptions.includestarttrx,
      ) as Promise<null | Array<IContentItem>>;
    }
    return getClient().Content.list(groupId, normalizedOptions);
  },
  postNote(content: any, groupId: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.PostToGroup(JSON.stringify(content)) as Promise<ICreateContentRes>;
    }
    return getClient().Content.create(groupId, content);
  },
};

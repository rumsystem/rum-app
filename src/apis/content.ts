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
    return getClient().Content.list(groupId, normalizedOptions);
  },
  postNote(content: unknown, groupId: string) {
    return getClient().Content.create(groupId, content as any);
  },
};

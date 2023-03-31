import { getClient } from './client';

export type { IContentItem } from 'rum-fullnode-sdk/dist/apis/content';

export default {
  fetchContents(
    groupId: string,
    options: {
      num: number
      starttrx?: string
      reverse?: boolean
      includestarttrx?: boolean
    },
  ) {
    return getClient().Content.list(groupId, {
      num: options.num,
      start_trx: options.starttrx ?? '',
      reverse: options.reverse ?? false,
      include_start_trx: options.includestarttrx ?? false,
    });
  },
  postNote(content: unknown, groupId: string) {
    return getClient().Content.create(groupId, content as any);
  },
};

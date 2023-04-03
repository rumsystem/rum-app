import React from 'react';
import { keyBy } from 'lodash';
import DOMPurify from 'dompurify';

import useDatabase from 'hooks/useDatabase';
import * as ImageModel from 'hooks/useDatabase/models/image';

import Schema from 'utils/schema';
import Base64 from 'utils/base64';
import { defaultRenderer } from 'utils/markdown';
import { useStore } from 'store';

export default () => {
  const database = useDatabase();
  const { activeGroupStore } = useStore();

  return React.useCallback(async (_md: string) => {
    let md = _md;
    const SCHEMA_PREFIX = Schema.getSchemaPrefix();

    if (md.includes(SCHEMA_PREFIX)) {
      const reg = new RegExp(`${SCHEMA_PREFIX}([\\w\\d-]*)`, 'g');
      const imageIds = (Array.from(md.matchAll(reg)) || []).map((v) => v[1]);
      if (imageIds.length > 0) {
        const images = await ImageModel.bulkGet(
          database,
          imageIds.map((id) => ({ groupId: activeGroupStore.id, id })),
        );
        const map = keyBy(images, 'id');
        md = md.replace(reg, (_match, match1) => {
          const id = match1;
          if (map[id]) {
            const image = map[id];
            if (image) {
              return Base64.getUrl(image);
            }
          }
          return '404';
        });
        md = md.replaceAll('![](404)', '<div style="display: inline-block; padding: 10px 20px; text-align: center; background: #888; color: #fff; font-size: 12px; opacity: 0.6;">图片加载失败</div>');
      }
    }

    return DOMPurify.sanitize(defaultRenderer.render(md));
  }, []);
};

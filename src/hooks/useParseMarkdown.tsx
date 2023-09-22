import React from 'react';
import { keyBy } from 'lodash';
import DOMPurify from 'dompurify';

import useDatabase from 'hooks/useDatabase';
import * as AttributedToModel from 'hooks/useDatabase/models/attributedTo';

import Schema from 'utils/schema';
import Base64 from 'utils/base64';
import { defaultRenderer } from 'utils/markdown';

export default () => {
  const database = useDatabase();

  return React.useCallback(async (_md: string) => {
    let md = _md;
    const SCHEMA_PREFIX = Schema.getSchemaPrefix();

    if (md.includes(SCHEMA_PREFIX)) {
      const reg = new RegExp(`${SCHEMA_PREFIX}([\\w\\d-]*)`, 'g');
      const trxIds = (Array.from(md.matchAll(reg)) || []).map((v) => v[1]);
      if (trxIds.length > 0) {
        const attributedToItems = await AttributedToModel.bulkGet(database, trxIds);
        const map = keyBy(attributedToItems, 'TrxId');
        md = md.replace(reg, (_match, match1) => {
          const trxId = match1;
          if (map[trxId]) {
            const { image } = map[trxId].Content;
            if (image && image[0]) {
              return Base64.getUrl(image[0]);
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

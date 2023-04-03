import { promises as fs } from 'fs';
import { Plugin, transformWithEsbuild } from 'vite';
import { transform } from '@svgr/core';
import jsxPlugin from '@svgr/plugin-jsx';

export const svgrPlugin = (): Plugin => ({
  name: 'vite-svgr-plugin',
  enforce: 'pre',
  load: async (id) => {
    const match = /^(.+\.svg)\?(fill|react|fill-icon|icon)$/.exec(id);
    if (match) {
      const filePath = match[1];
      const query = match[2];
      const svgContent = (await fs.readFile(filePath, 'utf8')).toString();
      const width = /width="(.+?)"/.exec(svgContent)?.[1];
      const height = /height="(.+?)"/.exec(svgContent)?.[1];
      const heightEm = (Number(height) || 1) / (Number(width) || 1);
      const isIcon = query === 'icon' || query === 'fill-icon';
      const jsCode = await transform(
        svgContent,
        {
          svgProps: {
            ...query === 'fill' || query === 'fill-icon'
              ? { fill: 'currentColor' }
              : {},
            ...width && height && isIcon
              ? {
                viewBox: `0 0 ${width} ${height}`,
                ...heightEm < 1 ? {
                  height: '1em',
                  width: `${(1 / heightEm).toFixed(3)}em`,
                } : {
                  width: '1em',
                  height: `${heightEm}em`,
                },
              }
              : {},
          },
          // icon: isIcon,
          plugins: [jsxPlugin],
        },
        {
          componentName: 'ReactComponent',
          filePath,
        },
      );
      const res = await transformWithEsbuild(
        jsCode,
        id,
        { loader: 'jsx' },
      );
      return {
        code: res.code,
        map: null,
      };
    }
    return undefined;
  },
});

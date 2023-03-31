import { promises as fs } from 'fs';
import { Plugin } from 'vite';

export const svgInline = (): Plugin => ({
  name: 'vite-svg-inline-plugin',
  enforce: 'pre',
  transform: async (_code, id) => {
    if (id.endsWith('.svg')) {
      try {
        const stat = await fs.stat(id);
        if (stat.size > 4096) {
          return;
        }
        const svgContent = (await fs.readFile(id, 'utf8')).toString();
        const svg = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

        return `export default ${JSON.stringify(svg)}`;
      } catch (e) { }
    }
    return undefined;
  },
});

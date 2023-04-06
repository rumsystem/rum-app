import path from 'path';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { svgInline } from './build/svg-inline';
import { svgrPlugin } from './build/vite-svgr-plugin';

const projectRootDir = path.resolve(__dirname);

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 1212,
  },
  build: {
    outDir: 'src/dist',
  },
  resolve: {
    alias: [
      ...[
        'apis',
        'components',
        'hooks',
        'layouts',
        'standaloneModals',
        'store',
        'styles',
        'utils',
      ].map((v) => ({
        find: v,
        replacement: path.resolve(projectRootDir, `src/${v}`),
      })),
      {
        find: 'assets',
        replacement: path.resolve(projectRootDir, 'assets'),
      },
      {
        find: 'lodash',
        replacement: 'lodash-es',
      },
    ],
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint --ext ".js,.jsx,.ts,.tsx" ./src',
        dev: {
          // cwd provided by vite cannot be handled by eslint with forward slash on windows
          // https://github.com/eslint/eslint/issues/17042
          overrideConfig: {
            cwd: __dirname,
          },
        },
      },
      overlay: false,
    }),
    react(),
    renderer({
      resolve: {
        'mixin-node-sdk': () => ({ platform: 'node' }),
        'fs-extra': () => ({ platform: 'node' }),
      },
    }),
    svgInline(),
    svgrPlugin(),
  ],
});

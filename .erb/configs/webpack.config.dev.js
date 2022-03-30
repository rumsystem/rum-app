const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const config = require('./webpack.config.base');

const port = process.env.PORT || 1212;

config.devtool('eval-source-map');
config.mode('development')

config.cache({
  type: 'filesystem',
  buildDependencies: {
    config: [
      __filename,
      path.join(__filename, '../webpack.config.base.js')
    ],
  },
})

config.output.publicPath(`http://localhost:${port}/dist/`)
config.output.path(path.join(__dirname, '../dev_dist'))
config.output.filename('renderer.dev.js')

config.plugin('react-fast-refresh')
  .use(ReactRefreshWebpackPlugin, [{
    overlay: { entry: false },
  }]);

config.plugin('fork-ts-checker-webpack-plugin')
  .use(ForkTsCheckerWebpackPlugin, [{
    async: true,
    typescript: {
      configFile: path.join(__dirname, '../../tsconfig.json'),
      diagnosticOptions: {
        semantic: true,
        syntactic: true,
      },
    },
    eslint: {
      enabled: true,
      files: [
        './src/**/*.{js,jsx,ts,tsx}',
      ],
    },
    logger: {
      devServer: false,
    },
  }]);

config.node
  .set('__dirname', false)
  .set('__filename', false)

module.exports = config;

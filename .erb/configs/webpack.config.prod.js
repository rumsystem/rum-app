const os = require('os');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const config = require('./webpack.config.base');

config.devtool(process.env.DEBUG_PROD === 'true' ? 'source-map' : false);
config.mode('production')

config.output.publicPath('./')
config.output.path(path.join(__dirname, '../../src/dist'))
config.output.filename('renderer.prod.js')

config.optimization.minimizer('terser')
  .use(TerserPlugin, [{
    extractComments: false,
    parallel: Math.min(4, os.cpus().length - 1),
    terserOptions: {
      format: {
        comments: false,
      },
    },
  }]);

module.exports = config.toConfig();

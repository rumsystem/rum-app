const os = require('os');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const StatsPlugin = require('stats-webpack-plugin');
const config = require('./webpack.config.base');

config.devtool(false);
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

config.plugin('BundleAnalyzerPlugin').use(BundleAnalyzerPlugin, [{
  analyzerMode: 'static',
}]);
config.plugin('SpeedMeasurePlugin').use(SpeedMeasurePlugin, [{
  outputFormat: 'humanVerbose',
  loaderTopFiles: 10,
}]);
config.plugin('StatsPlugin').use(StatsPlugin, [
  'stats.json',
  { chunkModules: true },
]);

config.plugin('duplicate-package-checker-webpack-plugin')
  .use(DuplicatePackageCheckerPlugin);

if (process.env.cat === 'false') {
  config.optimization.concatenateModules(false);
}

module.exports = config.toConfig();

/* eslint-disable import/first */
/* eslint-disable no-console */

const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config.dev');

const port = process.env.PORT || 1212;

const run = () => {
  const theConfig = config.toConfig();
  const compiler = webpack(theConfig);
  const devServer = new WebpackDevServer(compiler, {
    publicPath: theConfig.output.publicPath,
    https: false,
    host: 'localhost',
    sockPort: port,
    transportMode: 'ws',
    disableHostCheck: true,
    // writeToDisk: true,
    // contentBase: path.join(__dirname, '../public'),
    hot: true,
    stats: 'minimal',
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    },
  });

  devServer.listen(port);
};

run();

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at');
  console.log(promise);
  console.log('reason:');
  console.error(reason);
  console.log('');
  // Application specific logging, throwing an error, or other logic here
});

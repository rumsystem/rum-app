/* eslint-disable import/first */
/* eslint-disable no-console */

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config.dev');

const port = process.env.PORT || (process.env.WEBPACK_BROWSER ? 1213 : 1212);

const run = () => {
  const theConfig = config.toConfig();
  const compiler = webpack(theConfig);
  const devServer = new WebpackDevServer({
    https: false,
    host: 'localhost',
    port,
    webSocketServer: 'ws',
    allowedHosts: 'all',
    hot: true,
    client: {
      webSocketURL: {
        port,
      },
    },
    devMiddleware: {
      stats: 'minimal',
      publicPath: theConfig.output.publicPath,
    },
    static: false,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    },
  }, compiler);

  devServer.start();
};

run();

/**
 * Webpack config for production electron main process
 */

// import path from 'path';
// import webpack from 'webpack';
// import { merge } from 'webpack-merge';
// import TerserPlugin from 'terser-webpack-plugin';
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
// import baseConfig from './webpack.config.base';
// import CheckNodeEnv from '../scripts/CheckNodeEnv';
// import DeleteSourceMaps from '../scripts/DeleteSourceMaps';

// CheckNodeEnv('production');
// DeleteSourceMaps();

// const devtoolsConfig = process.env.DEBUG_PROD === 'true' ? {
//   devtool: 'source-map'
// } : {};

const path = require("path");
const packageJSON = require("../../package.json");

const dependencies = packageJSON.dependencies;
const optionalDependencies = packageJSON.optionalDependencies || {};
const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

// const CopyWebpackPlugin = require("copy-webpack-plugin");

// const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const deps = [].concat(
  Object.keys(dependencies),
  Object.keys(optionalDependencies)
);

export default {
  // ...devtoolsConfig,

  devtool: "source-map",

  mode: 'production',

  target: 'electron-main',

  entry: './src/main.js',

  output: {
    path: path.join(__dirname, '../../'),
    filename: './src/main.prod.js',
  },

  externals: deps,
  module: {
    rules: [
      // {
      //   test: /\.(js)$/,
      //   enforce: "pre",
      //   exclude: [
      //     /node_modules/,
      //     /lib/
      //   ],
      //   use: {
      //     loader: "eslint-loader",
      //     options: {
      //       formatter: require("eslint-friendly-formatter")
      //     }
      //   }
      // },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.node$/,
        use: "node-loader"
      }
    ]
  },

  optimization: {
    emitOnErrors: false,
    nodeEnv: (process.env.NODE_ENV === "production" ? "production" : "development")
  },

  // plugins: [
  //   new CleanWebpackPlugin({
  //     cleanOnceBeforeBuildPatterns: []
  //   }),
  //   new CopyWebpackPlugin({
  //     patterns: [
  //       {
  //         from: path.join(__dirname, "package.json"),
  //         to: path.join(outputDir)
  //       },
  //       {
  //         from: path.join(__dirname, "src", "main", "assets"),
  //         to: path.join(outputDir, "assets"),
  //         globOptions: {
  //           ignore: [".*"]
  //         }
  //       },
  //       {
  //         from: path.join(__dirname, "src", "main", "system-savers"),
  //         to: path.join(outputDir, "system-savers"),
  //         globOptions: {
  //           ignore: [".*"]
  //         }
  //       }
  //     ]
  //   })
  // ],

  resolve: {
    extensions: [".js", ".json", ".node"]
  },
  // optimization: {
  //   minimizer: [
  //     new TerserPlugin({
  //       parallel: true,
  //     }),
  //   ]
  // },

  // plugins: [
  //   new BundleAnalyzerPlugin({
  //     analyzerMode:
  //       process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
  //     openAnalyzer: process.env.OPEN_ANALYZER === 'true',
  //   }),

  //   /**
  //    * Create global constants which can be configured at compile time.
  //    *
  //    * Useful for allowing different behaviour between development builds and
  //    * release builds
  //    *
  //    * NODE_ENV should be production so that modules do not perform certain
  //    * development checks
  //    */
  //   new webpack.EnvironmentPlugin({
  //     NODE_ENV: 'production',
  //     DEBUG_PROD: false,
  //     START_MINIMIZED: false,
  //   }),
  // ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
};

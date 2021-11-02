const os = require('os');
const path  = require('path');
const webpack = require('webpack');
const Config = require('webpack-chain');
const TsconfigPathsPlugin  = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin  = require('html-webpack-plugin');

const workers = Math.min(2, os.cpus().length - 1);
const config = new Config();

config.entry('index')
  .add(path.join(__dirname, '../../src/index.tsx'));

config.output.path(path.join(__dirname, '../../src'))
// https://github.com/webpack/webpack/issues/1114
config.output.libraryTarget('commonjs2')

config.target('electron-renderer')

config.resolve.extensions
  .clear()
  .merge(['.js', '.jsx', '.json', '.ts', '.tsx'])

config.resolve
  .plugin('ts-path')
  .use(TsconfigPathsPlugin)
  .end()
  .alias
    .set('assets', path.join(__dirname, '../assets'))

config.cache({
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
})

config.module.rule('js')
  .test(/\.jsx?$/)
  .use('thread-loader')
  .loader('thread-loader')
  .options({ workers })
  .end()
  .use('babel')
  .loader('babel-loader')
  .end()
  .exclude.add(/node_modules/);

config.module.rule('ts')
  .test(/\.tsx?$/)
  .use('thread-loader')
  .loader('thread-loader')
  .options({ workers })
  .end()
  .use('babel')
  .loader('babel-loader')
  .end()
  .use('ts')
  .loader('ts-loader')
  .options({ transpileOnly: true, happyPackMode: true })
  .end()
  .exclude.add(/node_modules/);

config.module.rule('css')
  .test(/\.css$/)
  // .use('thread-loader')
  // .loader('thread-loader')
  // .options({ workers })
  // .end()
  .use('style-loader')
  .loader('style-loader')
  .end()
  .use('css-loader')
  .loader('css-loader')
  .end()
  .use('postcss-loader')
  .loader('postcss-loader')
  .end();

config.module.rule('sass')
  .test(/\.(sass|scss)$/)
  // comment out because it breaks tailwindcss hot reload
  // .use('thread-loader')
  // .loader('thread-loader')
  // .options({ workers })
  // .end()
  .use('style-loader')
  .loader('style-loader')
  .end()
  .use('css-loader')
  .loader('css-loader')
  .end()
  .use('postcss-loader')
  .loader('postcss-loader')
  .end()
  .use('sass-loader')
  .loader('sass-loader')
  .end();

config.module.rule('svg')
  .test(/\.svg$/)
  .oneOf('assets')
  .type('asset')
  .parser({
    dataUrlCondition: {
      maxSize: 8 * 1024, // 8kb
    },
  })
  .end()
  .oneOf('svgr')
  .before('assets')
  .resourceQuery(/^\?react$/)
  .use('@svgr/webpack')
  .loader('@svgr/webpack')
  .end();

config.module.rule('assets')
  .test(/\.(jpe?g|png|ico|gif|jpeg|webp)$/)
  .type('asset')
  .parser({
    dataUrlCondition: {
      maxSize: 8 * 1024, // 8kb
    },
  })
  .end();

config.module.rule('fonts')
  .test(/\.(ttf|eot|woff2?)$/)
  .type('asset')
  .parser({
    dataUrlCondition: {
      maxSize: 1024, // 1kb
    },
  })
  .end();

config.plugin('html-webpack-plugin')
  .use(HtmlWebpackPlugin, [{
    template: path.join(__dirname, '../../src/template.html'),
  }]);

config.plugin('build-env')
  .use(webpack.DefinePlugin, [{
    'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV ?? ''),
  }]);

module.exports = config;

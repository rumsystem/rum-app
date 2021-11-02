module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);

  const config = {
    sourceMaps: true,
    presets: [
      '@babel/preset-react',
      '@babel/preset-typescript',
      api.env('production') && ['@babel/preset-env', {
        modules: false,
        bugfixes: true,
        useBuiltIns: 'usage',
        corejs: 3,
      }],
    ].filter(Boolean),
    plugins: [
      ['@babel/plugin-transform-runtime', {
        useESModules: true,
      }],
      'styled-jsx/babel',
      !api.env('production') && 'react-refresh/babel',
    ].filter(Boolean),
  };

  return config;
};

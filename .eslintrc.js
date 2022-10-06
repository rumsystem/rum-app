module.exports = {
  extends: 'erb',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'react/require-default-props': 'off',
    'react/display-name': 'off',
    'react/button-has-type': 'off',
    'react/destructuring-assignment': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'react/jsx-boolean-value': 'off',
    'react/no-danger': 'off',
    '@typescript-eslint/no-namespace': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'no-empty': 'off',
    'no-return-assign': 'off',
    'jsx-a11y/iframe-has-title': 'off',
    'consistent-return': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-template': 'off',
    'prefer-destructuring': 'off'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.js'),
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};

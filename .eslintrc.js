const path = require('path');

module.exports = {
  'globals': {
    'document': false,
    'navigator': false,
    'window': false,
  },

  'extends': [
    '@noe132/eslint-config-react',
  ],

  'env': {
    'es6': true,
    'node': true,
    'browser': true,
  },

  'root': true,

  'settings': {
    'import/resolver': {
      // 'typescript': {},
      'typescript': {
        'project': path.join(__dirname, 'tsconfig.json'),
      },
    },
  },

  'overrides': [{
    'files': ['*'],
    'rules': {
      'react-hooks/rules-of-hooks': 'off',
      'max-classes-per-file': 'off',
      'consistent-return': 'off',
      'prefer-template': 'off',
      'no-nested-ternary': 'off',
      'import/order': 'off',
      'semi': ['error', 'always'],
    },
  }, {
    files: [
      '*.ts',
      '*.tsx',
    ],
    parserOptions: {
      project: 'tsconfig.json',
      tsconfigRootDir: __dirname,
    },
    'rules': {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',

      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          // custom: {
          //   regex: '^I[A-Z].+$',
          //   match: false,
          // },
        },
      ],

      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'semi': 'off',
      '@typescript-eslint/semi': ['error', 'always'],
    },
  }],

  'rules': {
    'import/no-unassigned-import': 'off',
    // 'no-empty-function': ['off', { 'allow': ['arrowFunctions'] }],
    'implicit-arrow-linebreak': 'off',
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/anchor-has-content': 'off',
    'react/jsx-no-target-blank': 'off',
    'react/no-danger': 'off',
  },
};

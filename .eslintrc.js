'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@darraghor-nestjs-typed/recommended',
  ],
  plugins: ['@darraghor-nestjs-typed'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Project-specific overrides
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'require-await': 'error',
    'no-return-await': 'error',
    // NestJS typed plugin rules - off to avoid noise on legacy codebase
    '@darraghor-nestjs-typed/no-unprefixed-description': 'off',
    '@darraghor-nestjs-typed/naming-convention': 'off',
    '@darraghor-nestjs-typed/no-unsafe-member-access': 'off',
    '@darraghor-nestjs-typed/no-unsafe-assignment': 'off',
    '@darraghor-nestjs-typed/no-null-keyword': 'off',
    '@darraghor-nestjs-typed/injectableables-should-be-provided': 'off',
    '@darraghor-nestjs-typed/class-methods-should-be-annotated': 'off',
    '@darraghor-nestjs-typed/parameters-should-be-annotated': 'off',
    '@darraghor-nestjs-typed/contextual-decorator': 'off',
  },
  overrides: [
    {
      files: ['src/main.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};

'use strict';

// eslint.config.js — ESLint v10 flat config
const eslintPluginNestjsTyped = require('@darraghor/eslint-plugin-nestjs-typed');

const nestJsTyped = eslintPluginNestjsTyped.default;
const nestJsTypedFlatRecommended = nestJsTyped.configs.flatRecommended;

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  ...nestJsTypedFlatRecommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      // Base ESLint rules
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'require-await': 'error',
      'no-return-await': 'error',
      // Disable noisy plugin rules for legacy codebase
      '@darraghor/nestjs-typed/provided-injected-should-match-factory-parameters': 'off',
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'off',
      '@darraghor/nestjs-typed/api-property-matches-property-optionality': 'off',
      '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'off',
      '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'off',
      '@darraghor/nestjs-typed/api-enum-property-best-practices': 'off',
      '@darraghor/nestjs-typed/api-property-returning-array-should-set-array': 'off',
      '@darraghor/nestjs-typed/validation-pipe-should-use-forbid-unknown': 'off',
      '@darraghor/nestjs-typed/param-decorator-name-matches-route-param': 'off',
      '@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator': 'off',
      '@darraghor/nestjs-typed/validate-nested-of-array-should-set-each': 'off',
      '@darraghor/nestjs-typed/all-properties-are-whitelisted': 'off',
      '@darraghor/nestjs-typed/all-properties-have-explicit-defined': 'off',
      '@darraghor/nestjs-typed/api-methods-should-be-guarded': 'off',
      '@darraghor/nestjs-typed/api-method-should-specify-api-operation': 'off',
      '@darraghor/nestjs-typed/sort-module-metadata-arrays': 'off',
      '@darraghor/nestjs-typed/no-duplicate-decorators': 'off',
      '@darraghor/nestjs-typed/use-injectable-provided-token': 'off',
      '@darraghor/nestjs-typed/api-property-should-have-api-extra-models': 'off',
      '@darraghor/nestjs-typed/api-operation-summary-description-capitalized': 'off',
      '@darraghor/nestjs-typed/use-dependency-injection': 'off',
      '@darraghor/nestjs-typed/use-correct-endpoint-naming-convention': 'off',
    },
  },
  {
    files: ['src/main.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Jest spec files: async mocks without await are common
    files: ['src/**/*.spec.js'],
    rules: {
      'require-await': 'off',
    },
  },
];

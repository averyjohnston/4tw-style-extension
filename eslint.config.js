import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import importRules from 'eslint-plugin-import';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    settings: {
      react: { version: '18.3' },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      }
    },
    plugins: {
      '@stylistic': stylistic,
      'import': importRules,
    },
    rules: {
      '@stylistic/quotes': ['warn', 'single'],
      '@stylistic/no-extra-parens': ['warn', 'all', {
        ignoreJSX: 'multi-line'
      }],
      '@stylistic/comma-dangle': ['warn', 'always-multiline'],
      '@stylistic/jsx-quotes': 'warn',
      '@stylistic/spaced-comment': 'warn',
      '@stylistic/jsx-self-closing-comp': 'warn',
      '@stylistic/jsx-wrap-multilines': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-base-to-string': ['warn', {
        ignoredTypeNames: ['Error', 'FormDataEntryValue', 'RegExp', 'URL', 'URLSearchParams']
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'sort-imports': ['warn', {
        ignoreDeclarationSort: true,
        ignoreCase: true,
      }],
      'import/order': ['warn', {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        warnOnUnassignedImports: true
      }],
    },
  },
)

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import js from '@eslint/js';

const tsRules = tsPlugin.configs['recommended-type-checked']?.rules ?? {};
const baseRules = js.configs.recommended?.rules ?? {};
const parserOptions = {
  project: './tsconfig.eslint.json',
  tsconfigRootDir: process.cwd(),
  sourceType: 'module'
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions,
      globals: globals.node
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...baseRules,
      ...tsRules,
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
      'no-console': 'warn'
    }
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions,
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...baseRules,
      ...tsRules,
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'no-console': 'off'
    }
  }
];

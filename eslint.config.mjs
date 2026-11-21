import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/', '**/build/', '**/coverage/', '**/.turbo/', '**/.expo/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          enforceConst: true,
        },
      ],
    },
  },
  {
    files: ['packages/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-native', 'react-native/*', 'expo', 'expo/*', 'expo-*', '@expo/*'],
              message: 'Shared packages must stay platform-neutral.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);

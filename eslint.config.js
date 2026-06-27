import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The React Hooks 7 recommended preset enables React Compiler-oriented
      // checks. This theme still contains common client-app patterns such as
      // synchronizing local UI state in effects and imperative deep-link
      // navigation, so keep lint focused on correctness instead of blocking
      // existing UI behavior.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // shadcn/ui style component files intentionally export variants,
      // contexts, and hooks next to components.
      'react-refresh/only-export-components': 'off',
    },
  },
])

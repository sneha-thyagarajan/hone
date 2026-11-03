// @ts-check
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // ── Architectural guard: components must not import the DB layer directly ──
  // DB access belongs in features/*Actions.ts or features/use*.ts hooks.
  // See docs/architecture.md § "CI rule" for context.
  //
  // `@/db/types` is allowed everywhere — it only contains TS interfaces.
  // What is blocked is the db singleton (`@/db`, `@/db/index`) and dexie itself.
  //
  // NOTE: src/app/pages/note-editor.tsx and code-practice.tsx currently have
  // violations (tracked as P1 in the refactor plan). Until those are fixed the
  // guard covers src/components/** only. Once P1 is resolved, extend
  // `files` to include 'src/app/**/*.{ts,tsx}' and
  // 'src/features/**/*.tsx' (the UI layer of every feature slice).
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // `paths` does exact matching — @/db/types (plain TS interfaces) is
          // deliberately excluded and remains importable everywhere.
          paths: [
            {
              name: '@/db',
              message:
                'Import db via a feature action or hook, not directly in a component. ' +
                'See docs/architecture.md § R1.',
            },
            {
              name: 'dexie',
              message:
                'Import db via a feature action or hook, not directly in a component. ' +
                'See docs/architecture.md § R1.',
            },
            {
              name: 'dexie-react-hooks',
              message:
                'Import db via a feature action or hook, not directly in a component. ' +
                'See docs/architecture.md § R1.',
            },
          ],
        },
      ],
    },
  },
)

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    // Node maintenance/deploy scripts are CommonJS by design (run directly
    // with `node scripts/...`, no bundler/ESM loader). require() is correct
    // there; the TS rule targets typed source, not ops scripts.
    files: ['scripts/**/*.js', 'deploy/**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Submodule working trees (incl. their .next build output) lint in their
  // own repos; the root config must not crawl them.
  globalIgnores(['apps/**']),
]);

export default eslintConfig;

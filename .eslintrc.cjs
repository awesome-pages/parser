module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    '.eslintrc.cjs',
    'dist',
    'node_modules',
    '*.config.js',
    'vitest.config.ts',
    'src/tests/fixtures/**/*.json',
  ],
  rules: {},
};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    
    // Prettier integration
    'prettier/prettier': 'error',
    
    // Disable rules that conflict with TypeScript
    'no-unused-vars': 'off',
    'no-undef': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'lib/',
    'dist/',
    'coverage/',
    '*.js',
    '!jest.config.js',
    '!.eslintrc.js'
  ],
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
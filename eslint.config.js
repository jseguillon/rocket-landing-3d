import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        URLSearchParams: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn'
    }
  }
];

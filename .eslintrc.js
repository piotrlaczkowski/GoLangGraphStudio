module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Allow unused variables during development
    '@typescript-eslint/no-unused-vars': 'warn',
    // Make React hooks dependency warnings less strict
    'react-hooks/exhaustive-deps': 'warn',
    // Allow empty dependency arrays
    'react-hooks/deps': 'warn'
  }
}; 
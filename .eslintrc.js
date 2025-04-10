module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended', // or other configs you use
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-extra-boolean-cast': 'off',
    'no-undef': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-case-declarations': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
}

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  env: {
    node: true,
    es6: true,
    browser: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/recommended'
  ],
  overrides: [
    {
      env: { node: true },
      files: ['.eslintrc.{js,cjs}'],
      extends: ['standard'],
      parserOptions: {
        sourceType: 'script'
      }
    },
    {
      files: ['dist/**/*.js'],
      extends: ['eslint:recommended']
    },
    {
      files: ['webpack.config.js'],
      extends: ['eslint:recommended']
    },
    {
      env: { browser: true },
      files: ['src/**/*.jsx']
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './jsconfig.json',
    jsconfigRootDir: './'
  },
  plugins: [
    'react',
    'import'
  ],
  rules: {
    semi: ['error', 'never'],
    'no-console': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    indent: ['error', 2]
  }
}

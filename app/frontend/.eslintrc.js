module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    _: false,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'eol-last': ['error', 'always'],
    'linebreak-style': ['error', 'unix'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    semi: ['error', 'always'],
    'vue/html-closing-bracket-newline': [
      'off',
      {
        singleline: 'never',
        multiline: 'never',
      },
    ],
    'vue/max-attributes-per-line': [
      'off',
      {
        singleline: 1,
        multiline: {
          max: 1,
          allowFirstLine: true,
        },
      },
    ],
    'vue/multi-word-component-names': 'off',
    'vue/no-multi-spaces': [
      'error',
      {
        ignoreProperties: false,
      },
    ],
    'vue/no-spaces-around-equal-signs-in-attribute': ['error'],
    'vue/require-default-prop': 'off',
    /* This is necessary until we have packages that conform to this */
    'vue/v-on-event-hyphenation': [ "off", {
      autofix: false,
    }],
    'vue/no-lone-template': 'off',
    /* Should probably remove this and fix the existing issues */
    'vue/no-template-shadow': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};

import { config } from '@vue/test-utils';
import { vi } from 'vitest';
import { ref } from 'vue';

const i18n = vi.fn(() => {});
const translate = vi.fn(() => {});
const locales = [
  'ar',
  'de',
  'en',
  'es',
  'fa',
  'fr',
  'hi',
  'it',
  'ja',
  'ko',
  'pa',
  'pt',
  'ru',
  'tl',
  'uk',
  'vi',
  'zh',
  'zhTW',
];

translate.mockImplementation((key, options = {}) => {
  return {
    key,
    options,
  };
});

i18n.mockImplementation(() => {
  return {
    locale: ref('en'),
    t: translate,
  };
});

vi.mock('vue-i18n', () => {
  return {
    createI18n: (_options) => {
      return {
        global: {
          t: (key, _options = {}) => key,
        },
        locale: ref('en'),
      };
    },
    useI18n: () => ({
      t: (key, _options = {}) => key,
      locale: ref('en'),
    }),
  };
});

config.global.mocks = {
  $i18n: () => ({
    locale: 'en',
    availableLocales: locales,
  }),
  $t: (key, _options = {}) => key,
};

beforeEach(() => {
  translate.mockReset();
  i18n.mockReset();
});

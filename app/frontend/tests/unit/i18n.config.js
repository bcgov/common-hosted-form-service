import { config } from '@vue/test-utils';
import { vi } from 'vitest';

const i18n = vi.fn(() => {});
const translate = vi.fn(() => {});

translate.mockImplementation((key, options = {}) => {
  return {
    key,
    options,
  };
});

i18n.mockImplementation(() => {
  return {
    locale: 'en',
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
      };
    },
    useI18n: () => ({
      t: (key, _options = {}) => key,
    }),
  };
});

config.global.mocks = {
  $i18n: () => ({
    locale: 'en',
  }),
  $t: (tKey) => tKey,
};

beforeEach(() => {
  translate.mockReset();
  i18n.mockReset();
});

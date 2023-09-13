import { config } from '@vue/test-utils';
import i18n from '~/internationalization';
config.global.plugins = [...config.global.plugins, i18n];

config.global.mocks = {
  $t: (tkey) => tkey,
};

import { config } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

config.plugins.VueWrapper.install(createVuetify());
import { createStore, createLogger } from 'vuex';

import form from '@src/store/modules/form.js';
import notifications from '@src/store/modules/notifications.js';

const plugins = [];

if (import.meta.env.NODE_ENV !== 'production') {
  plugins.push(createLogger());
}

export default createStore({
  // Modules not specified below are expected to dynamically register when needed
  modules: { form, notifications },
  plugins: plugins,
  state: {},
  mutations: {},
  actions: {},
});

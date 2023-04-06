import Vue from 'vue';
import Vuex from 'vuex';

import form from '@/store/modules/form.js';
import notifications from '@/store/modules/notifications.js';

Vue.use(Vuex);

const plugins = [];

if (process.env.NODE_ENV !== 'production') {
  plugins.push(Vuex.createLogger());
}

export default new Vuex.Store({
  // Modules not specified below are expected to dynamically register when needed
  modules: { form, notifications },
  plugins: plugins,
  state: {},
  mutations: {},
  actions: {},
});

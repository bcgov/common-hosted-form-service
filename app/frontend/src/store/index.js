import Vue from 'vue';
import Vuex from 'vuex';

import form from '@/store/modules/form.js';
import notifications from '@/store/modules/notifications.js';

Vue.use(Vuex);

export default new Vuex.Store({
  // Modules not specified below are expected to dynamically register when needed
  modules: { form, notifications },
  state: {},
  mutations: {},
  actions: {}
});

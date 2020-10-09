import Vue from 'vue';
import Vuex from 'vuex';

import form from '@/store/modules/form.js';
import notifications from '@/store/modules/notifications.js';

Vue.use(Vuex);

export default new Vuex.Store({
  // auth module is dynamically loaded when invoking secured pages
  modules: { form, notifications },
  state: {},
  mutations: {},
  actions: {}
});

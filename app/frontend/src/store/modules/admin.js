import { adminService } from '@/services';

/**
 * Admin Module
 */
export default {
  namespaced: true,
  state: {
    formList: [],
    userList: []
  },
  getters: {
    formList: state => state.formList,
    userList: state => state.userList
  },
  mutations: {
    SET_FORMLIST(state, forms) {
      state.formList = forms;
    },
    SET_USERIST(state, users) {
      state.userList = users;
    }
  },
  actions: {
    //
    // Forms
    //
    async getForms({ commit, dispatch }, activeOnly) {
      try {
        commit('SET_FORMLIST', []);
        // Get all forms
        const response = await adminService.listForms(activeOnly);
        commit('SET_FORMLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching forms.',
          consoleError: `Error getting admin form data: ${error}`,
        }, { root: true });
      }
    },

    //
    // Users
    //
    async getUsers({ commit, dispatch }) {
      try {
        // Get all forms
        const response = await adminService.listForms();
        commit('SET_FORMLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching forms.',
          consoleError: `Error getting admin form data: ${error}`,
        }, { root: true });
      }
    },
  },
};

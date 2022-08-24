import { NotificationTypes } from '@/utils/constants';
import { adminService } from '@/services';

/**
 * Admin Module
 */
export default {
  namespaced: true,
  state: {
    apiKey: undefined,
    form: {},
    formList: [],
    roles: [],
    user: {},
    userList: []
  },
  getters: {
    apiKey: state => state.apiKey,
    form: state => state.form,
    formList: state => state.formList,
    roles: state => state.roles,
    user: state => state.user,
    userList: state => state.userList
  },
  mutations: {
    SET_API_KEY(state, apiKey) {
      state.apiKey = apiKey;
    },
    SET_FORM(state, form) {
      state.form = form;
    },
    SET_FORMLIST(state, forms) {
      state.formList = forms;
    },
    SET_ROLES(state, roles) {
      state.roles = roles;
    },
    SET_USER(state, user) {
      state.user = user;
    },
    SET_USERLIST(state, users) {
      state.userList = users;
    }
  },
  actions: {
    //
    // Forms
    //
    async addFormUser({ dispatch }, formUser) {
      try {
        const response = await adminService.addFormUser(formUser.userId, formUser.formId, formUser.roles);
        dispatch('notifications/addNotification', {
          message:
            `Added the Owner role for this form to ${response.data[0].fullName}`,
          ...NotificationTypes.SUCCESS
        }, { root: true });
        // Re-get the form users
        dispatch('readRoles', formUser.formId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while adding the role.',
          consoleError: `Error adding user ${formUser.userId} to form ${formUser.formId}: ${error}`,
        }, { root: true });
      }
    },
    async deleteApiKey({ commit, dispatch }, formId) {
      try {
        await adminService.deleteApiKey(formId);
        commit('SET_API_KEY', undefined);
        dispatch('notifications/addNotification', {
          message:
            'The API Key for this form has been deleted.',
          ...NotificationTypes.SUCCESS
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to delete the API Key.',
          consoleError: `Error deleting API Key for form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async getForms({ commit, dispatch }, activeOnly) {
      try {
        commit('SET_FORMLIST', []);
        // Get all forms
        const response = await adminService.listForms(activeOnly);
        commit('SET_FORMLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching forms.',
          consoleError: `Error getting admin form data: ${error}`,
        }, { root: true });
      }
    },
    async readForm({ commit, dispatch }, formId) {
      try {
        commit('SET_FORM', {});
        // Get specific form
        const response = await adminService.readForm(formId);
        commit('SET_FORM', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form.',
          consoleError: `Error getting admin form ${formId} data: ${error}`,
        }, { root: true });
      }
    },
    async readRoles({ commit, dispatch }, formId) {
      try {
        // Get specific roles
        const response = await adminService.readRoles(formId);
        commit('SET_ROLES', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching form user roles.',
          consoleError: `Error getting admin roles data: ${error}`,
        }, { root: true });
      }
    },
    async readApiDetails({ commit, dispatch }, formId) {
      try {
        // Get form's api details
        const response = await adminService.readApiDetails(formId);
        commit('SET_API_KEY', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form\'s API details.',
          consoleError: `Error getting admin API details from form ${formId} data: ${error}`,
        }, { root: true });
      }
    },
    async restoreForm({ commit, dispatch }, formId) {
      try {
        // Get specific form
        const response = await adminService.restoreForm(formId);
        commit('SET_FORM', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while restoring this form.',
          consoleError: `Error restoring form ${formId} data: ${error}`,
        }, { root: true });
      }
    },

    //
    // Users
    //
    async getUsers({ commit, dispatch }) {
      try {
        // Get all users
        commit('SET_USERLIST', []);
        const response = await adminService.listUsers();
        commit('SET_USERLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching users.',
          consoleError: `Error getting admin users data: ${error}`,
        }, { root: true });
      }
    },
    async readUser({ commit, dispatch }, userId) {
      try {
        // Get a users
        commit('SET_USER', {});
        const response = await adminService.readUser(userId);
        commit('SET_USER', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this user.',
          consoleError: `Error getting admin user ${userId} data: ${error}`,
        }, { root: true });
      }
    },
  },
};

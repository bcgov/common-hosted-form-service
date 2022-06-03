import { NotificationTypes } from '@/utils/constants';
import { adminService } from '@/services';
import axios from 'axios';

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
    userList: [],
    fcHelpInfoGroupObject:{}, // Form Components Help Information Object
    fcHelpInfo:{}, // Form Component Help Information
    fcHelpInfoImageUpload:'' // Form Component Help Information image upload url
  },
  getters: {
    apiKey: state => state.apiKey,
    form: state => state.form,
    formList: state => state.formList,
    roles: state => state.roles,
    user: state => state.user,
    userList: state => state.userList,
    fcHelpInfoGroupObject: state => state.fcHelpInfoGroupObject,
    fcHelpInfo: state => state.fcHelpInfo,
    fcHelpInfoImageUpload: state=> state.fcHelpInfoImageUpload
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
    },
    SET_FCHELPINFOGroupObject(state,fcHelpInfoGroupObject){
      state.fcHelpInfoGroupObject = fcHelpInfoGroupObject;
    },
    SET_FCHELPINFO(state,fcHelpInfo) //Common Component Help Information
    {
      state.fcHelpInfo = fcHelpInfo;
    },
    SET_FCHELPINFOIMAGEUPLOAD(state,fcHelpInfoImageUpload)
    {
      state.fcHelpInfoImageUpload = fcHelpInfoImageUpload;
    }
  },
  actions: {
    //
    // Forms
    //
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

   

    async listFormComponentsHelpInfo({ commit, dispatch }) {
      try {
        // Get Common Components Help Information
        commit('SET_FCHELPINFOGroupObject',{});
        const response = await adminService.listFormComponentsHelpInfo();
        commit('SET_FCHELPINFOGroupObject',response.data);
      } catch(error) {
        
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching form builder components',
          consoleError: 'Error getting form builder components',
        }, { root: true });
      }
    },

    async addFormComponentHelpInfo({ commit, dispatch },data) {
      try {
        // Get Common Components Help Information
        commit('SET_FCHELPINFO',{});
        const response = await adminService.addFormComponentHelpInfo(data);
        commit('SET_FCHELPINFO',response.data);
      } catch(error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this user.',
          consoleError: 'Error getting admin user  data',
        }, { root: true });
      }
    },

    async updateFormComponentsHelpInfoStatus({ commit, dispatch },{componentId, publishStatus}) {
      try {
        // Get Common Components Help Information
        commit('SET_FCHELPINFO',{});
        const response = await adminService.updateFormComponentsHelpInfoStatus(componentId, publishStatus);
        commit('SET_FCHELPINFO',response.data);
      } catch(error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this user.',
          consoleError: 'Error getting admin user  data',
        }, { root: true });
      }
    },
    async uploadFormComponentsHelpInfoImage({ commit,dispatch },imageData) {
      try {
        commit('SET_FCHELPINFOIMAGEUPLOAD','');
        let response = await adminService.uploadImageUrl(imageData.componentName);
        
        if(response && response.data){
          let config = {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          };
          const res = await axios.put(response.data,imageData.image,config);
          if(res){
            commit('SET_FCHELPINFOIMAGEUPLOAD',response.data.split('?')[0]);
          }
        }
      } catch(error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this user.',
          consoleError: 'Error getting admin user  data',
        }, { root: true });
      }
    }
  },
 
};

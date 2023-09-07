import { NotificationTypes } from '@/utils/constants';
import { adminService } from '@/services';
import i18n from '@/internationalization';

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
    fcProactiveHelp: {}, // Form Component Proactive Help
    fcProactiveHelpImageUrl: '',
    fcProactiveHelpGroupList: [],
  },
  getters: {
    apiKey: (state) => state.apiKey,
    form: (state) => state.form,
    formList: (state) => state.formList,
    roles: (state) => state.roles,
    user: (state) => state.user,
    userList: (state) => state.userList,
    fcProactiveHelp: (state) => state.fcProactiveHelp, //Form Component Proactive Help
    fcProactiveHelpImageUrl: (state) => state.fcProactiveHelpImageUrl,
    fcProactiveHelpGroupList: (state) => state.fcProactiveHelpGroupList, // Form Components Proactive Help Group Object
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
    SET_FCPROACTIVEHELP(
      state,
      fcProactiveHelp //Form Component Proactive Help
    ) {
      state.fcProactiveHelp = fcProactiveHelp;
    },

    SET_FCPROACTIVEHELPIMAGEURL(state, fcProactiveHelpImageUrl) {
      state.fcProactiveHelpImageUrl = fcProactiveHelpImageUrl;
    },
    //Form Component Proactive Help Group Object
    SET_FCPROACTIVEHELPGROUPLIST(state, fcProactiveHelpGroupList) {
      state.fcProactiveHelpGroupList = fcProactiveHelpGroupList;
    },
  },
  actions: {
    //
    // Forms
    //
    async addFormUser({ dispatch }, formUser) {
      try {
        const response = await adminService.addFormUser(
          formUser.userId,
          formUser.formId,
          formUser.roles
        );
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.addFormOwnerRole', {
              fullName: response.data[0].fullName,
            }),
            ...NotificationTypes.SUCCESS,
          },
          { root: true }
        );
        // Re-get the form users
        dispatch('readRoles', formUser.formId);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.addRowError'),
            consoleError: i18n.t('trans.store.admin.addRowError', {
              userId: formUser.userId,
              formId: formUser.formId,
              error: error,
            }),
          },
          { root: true }
        );
      }
    },
    async deleteApiKey({ commit, dispatch }, formId) {
      try {
        await adminService.deleteApiKey(formId);
        commit('SET_API_KEY', undefined);
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.apiKeyDelMsg'),
            ...NotificationTypes.SUCCESS,
          },
          { root: true }
        );
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.errDeletingApiKey'),
            consoleError: i18n.t('trans.store.admin.apiKeyDelMsg', {
              formId: formId,
              error: error,
            }),
          },
          { root: true }
        );
      }
    },
    async getForms({ commit, dispatch }, activeOnly) {
      try {
        commit('SET_FORMLIST', []);
        // Get all forms
        const response = await adminService.listForms(activeOnly);
        commit('SET_FORMLIST', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.fecthingFormsErrMsg'),
            consoleError: i18n.t('trans.store.admin.fecthingFormsErrMsg', {
              error: error,
            }),
          },
          { root: true }
        );
      }
    },
    async readForm({ commit, dispatch }, formId) {
      try {
        commit('SET_FORM', {});
        // Get specific form
        const response = await adminService.readForm(formId);
        commit('SET_FORM', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.fecthingFormErrMsg'),
            consoleError: i18n.t('trans.store.admin.fecthingFormsErrMsg', {
              formId: formId,
              error: error,
            }),
          },
          { root: true }
        );
      }
    },
    async readRoles({ commit, dispatch }, formId) {
      try {
        // Get specific roles
        const response = await adminService.readRoles(formId);
        commit('SET_ROLES', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.fecthFormUserRolesErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.fecthFormUserRolesConsErrMsg',
              { error: error }
            ),
          },
          { root: true }
        );
      }
    },
    async readApiDetails({ commit, dispatch }, formId) {
      try {
        // Get form's api details
        const response = await adminService.readApiDetails(formId);
        commit('SET_API_KEY', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.fecthApiDetailsErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.fecthApiDetailsConsErrMsg',
              { formId: formId, error: error }
            ),
          },
          { root: true }
        );
      }
    },
    async restoreForm({ commit, dispatch }, formId) {
      try {
        // Get specific form
        const response = await adminService.restoreForm(formId);
        commit('SET_FORM', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.restoreFormErrMsg'),
            consoleError: i18n.t('trans.store.admin.restoreFormConsErrMsg', {
              formId: formId,
              error: error,
            }),
          },
          { root: true }
        );
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
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.getUsersErrMsg'),
            consoleError: i18n.t('trans.store.admin.getUsersConsErrMsg', {
              error: error,
            }),
          },
          { root: true }
        );
      }
    },
    async readUser({ commit, dispatch }, userId) {
      try {
        // Get a users
        commit('SET_USER', {});
        const response = await adminService.readUser(userId);
        commit('SET_USER', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.getUserErrMsg'),
            consoleError: i18n.t('trans.store.admin.getUserConsErrMsg', {
              userId: userId,
              error: error,
            }),
          },
          { root: true }
        );
      }
    },

    //addFormComponentsProactiveHelp
    async addFCProactiveHelp({ commit, dispatch }, data) {
      try {
        // Get Common Components Help Information
        commit('SET_FCPROACTIVEHELP', {});
        const response = await adminService.addFCProactiveHelp(data);
        commit('SET_FCPROACTIVEHELP', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.storingFCHelpInfoErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.storingFCHelpInfoConsErrMsg',
              { error: error }
            ),
          },
          { root: true }
        );
      }
    },

    async getFCProactiveHelpImageUrl({ commit, dispatch }, componentId) {
      try {
        // Get Common Components Help Information
        commit('SET_FCPROACTIVEHELPIMAGEURL', {});
        const response = await adminService.getFCProactiveHelpImageUrl(
          componentId
        );
        commit('SET_FCPROACTIVEHELPIMAGEURL', response.data.url);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.gettingFCImgUrlErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.gettingFCImgUrlConsErrMsg',
              { error: error }
            ),
          },
          { root: true }
        );
      }
    },

    //updateFormComponentsProactiveHelpStatus
    async updateFCProactiveHelpStatus(
      { commit, dispatch },
      { componentId, publishStatus }
    ) {
      try {
        // Get Common Components Help Information
        const response = await adminService.updateFCProactiveHelpStatus(
          componentId,
          publishStatus
        );
        commit('SET_FCPROACTIVEHELP', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.updatingFCStatusErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.updatingFCStatusConsErrMsg',
              { error: error }
            ),
          },
          { root: true }
        );
      }
    },

    //listFormComponentsProactiveHelp
    async listFCProactiveHelp({ commit, dispatch }) {
      try {
        // Get Form Components Proactive Help Group Object
        commit('SET_FCPROACTIVEHELPGROUPLIST', {});
        const response = await adminService.listFCProactiveHelp();
        commit('SET_FCPROACTIVEHELPGROUPLIST', response.data);
      } catch (error) {
        dispatch(
          'notifications/addNotification',
          {
            message: i18n.t('trans.store.admin.fecthingFormBuilderCompsErrMsg'),
            consoleError: i18n.t(
              'trans.store.admin.fecthingFormBuilderCompsConsErrMsg',
              { error: error }
            ),
          },
          { root: true }
        );
      }
    },
  },
};

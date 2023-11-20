import { defineStore } from 'pinia';
import { i18n } from '~/internationalization';

import { adminService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    apiKey: undefined,
    form: {},
    formList: [],
    roles: [],
    user: {},
    userList: [],
    fcProactiveHelp: {}, // Form Component Proactive Help
    fcProactiveHelpImageUrl: '',
    fcProactiveHelpGroupList: [],
  }),
  getters: {},
  actions: {
    //
    // Forms
    //
    async addFormUser(formUser) {
      const notificationStore = useNotificationStore();
      try {
        const response = await adminService.addFormUser(
          formUser.userId,
          formUser.formId,
          formUser.roles
        );
        // Re-get the form users
        this.readRoles(formUser.formId);
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.addFormOwnerRole', {
            fullName: response.data[0].fullName,
          }),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.addRowError'),
          consoleError: i18n.t('trans.store.admin.addRowError', {
            userId: formUser.userId,
            formId: formUser.formId,
            error: error,
          }),
        });
      }
    },
    async deleteApiKey(formId) {
      try {
        await adminService.deleteApiKey(formId);
        this.apiKey = undefined;
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.apiKeyDelMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.errDeletingApiKey'),
          consoleError: i18n.t('trans.store.admin.apiKeyDelMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async getForms(activeOnly) {
      try {
        this.formList = [];
        // Get all forms
        const response = await adminService.listForms(activeOnly);
        this.formList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.fecthingFormsErrMsg'),
          consoleError: i18n.t('trans.store.admin.fecthingFormsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async readForm(formId) {
      try {
        this.form = {};
        // Get specific form
        const response = await adminService.readForm(formId);
        this.form = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.fecthingFormErrMsg'),
          consoleError: i18n.t('trans.store.admin.fecthingFormsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async readRoles(formId) {
      try {
        // Get specific roles
        const response = await adminService.readRoles(formId);
        this.roles = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.fecthFormUserRolesErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.fecthFormUserRolesConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async readApiDetails(formId) {
      try {
        // Get form's api details
        const response = await adminService.readApiDetails(formId);
        this.apiKey = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.fecthApiDetailsErrMsg'),
          consoleError: i18n.t('trans.store.admin.fecthApiDetailsConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async restoreForm(formId) {
      try {
        // Get specific form
        const response = await adminService.restoreForm(formId);
        this.form = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.restoreFormErrMsg'),
          consoleError: i18n.t('trans.store.admin.restoreFormConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },

    //
    // Users
    //
    async getUsers() {
      try {
        // Get all users
        this.userList = [];
        const response = await adminService.listUsers();
        this.userList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getUsersErrMsg'),
          consoleError: i18n.t('trans.store.admin.getUsersConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async readUser(userId) {
      try {
        // Get a users
        this.user = {};
        const response = await adminService.readUser(userId);
        this.user = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getUserErrMsg'),
          consoleError: i18n.t('trans.store.admin.getUserConsErrMsg', {
            userId: userId,
            error: error,
          }),
        });
      }
    },

    //addFormComponentsProactiveHelp
    async addFCProactiveHelp(data) {
      try {
        // Get Common Components Help Information
        this.fcProactiveHelp = {};
        const response = await adminService.addFCProactiveHelp(data);
        this.fcProactiveHelp = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.storingFCHelpInfoErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.storingFCHelpInfoConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },

    async getFCProactiveHelpImageUrl(componentId) {
      try {
        // Get Common Components Help Information
        this.fcProactiveHelpImageUrl = '';
        const response = await adminService.getFCProactiveHelpImageUrl(
          componentId
        );
        this.fcProactiveHelpImageUrl = response.data.url;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.gettingFCImgUrlErrMsg'),
          consoleError: i18n.t('trans.store.admin.gettingFCImgUrlConsErrMsg', {
            error: error,
          }),
        });
      }
    },

    //updateFormComponentsProactiveHelpStatus
    async updateFCProactiveHelpStatus({ componentId, publishStatus }) {
      try {
        // Get Common Components Help Information
        const response = await adminService.updateFCProactiveHelpStatus(
          componentId,
          publishStatus
        );
        this.fcProactiveHelp = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.updatingFCStatusErrMsg'),
          consoleError: i18n.t('trans.store.admin.updatingFCStatusConsErrMsg', {
            error: error,
          }),
        });
      }
    },

    //listFormComponentsProactiveHelp
    async listFCProactiveHelp() {
      try {
        // Get Form Components Proactive Help Group Object
        this.fcProactiveHelpGroupList = [];
        const response = await adminService.listFCProactiveHelp();
        this.fcProactiveHelpGroupList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.fecthingFormBuilderCompsErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.fecthingFormBuilderCompsConsErrMsg',
            { error: error }
          ),
        });
      }
    },
  },
});

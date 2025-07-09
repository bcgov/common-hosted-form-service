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
    formTotal: undefined,
    roles: [],
    user: {},
    userList: [],
    userTotal: undefined,
    externalAPIList: [],
    apiTotal: undefined,
    externalAPIStatusCodes: [],
    fcProactiveHelp: {}, // Form Component Proactive Help
    fcProactiveHelpImageUrl: '',
    fcProactiveHelpGroupList: [],
    formEmbedDomainsList: [],
    formEmbedDomainsTotal: undefined,
    formEmbedDomainStatusCodes: [],
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
    async getForms(params) {
      try {
        this.formList = [];
        // Get all forms
        const response = await adminService.listForms(params);
        if (response.data.results) {
          this.formList = response.data.results;
          this.formTotal = response.data.total;
        } else {
          this.formList = response.data;
          this.formTotal = response.data.length;
        }
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
    async getUsers(params) {
      try {
        // Get all users
        this.userList = [];
        const response = await adminService.listUsers(params);
        if (response.data.results) {
          this.userList = response.data.results;
          this.userTotal = response.data.total;
        } else {
          this.userList = response.data;
          this.userTotal = response.data.length;
        }
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

    //
    // External APIs
    //
    async getExternalAPIs(params) {
      try {
        // Get all external apis
        this.externalAPIList = [];
        const response = await adminService.listExternalAPIs(params);
        if (response.data.results) {
          this.externalAPIList = response.data.results;
          this.apiTotal = response.data.total;
        } else {
          this.externalAPIList = response.data;
          this.apiTotal = response.data.length;
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getAPIsErrMsg'),
          consoleError: i18n.t('trans.store.admin.getAPIsConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async updateExternalAPI(id, data) {
      try {
        await adminService.updateExternalAPI(id, data);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.updateAPIsErrMsg'),
          consoleError: i18n.t('trans.store.admin.updateAPIsConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async getExternalAPIStatusCodes() {
      try {
        this.externalAPIStatusCodes = [];
        const response = await adminService.listExternalAPIStatusCodes();
        this.externalAPIStatusCodes = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getAPICodesErrMsg'),
          consoleError: i18n.t('trans.store.admin.getAPICodesConsErrMsg', {
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

    //
    // External APIs
    //
    async getFormEmbedDomains(params) {
      try {
        // Get all external apis
        this.formEmbedDomainsList = [];
        const response = await adminService.getFormEmbedDomains(params);
        if (response.data.results) {
          this.formEmbedDomainsList = response.data.results;
          this.formEmbedDomainsTotal = response.data.total;
        } else {
          this.formEmbedDomainsList = response.data;
          this.formEmbedDomainsTotal = response.data.length;
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getFormEmbedDomainsErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.getFormEmbedDomainsConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async getFormEmbedDomainHistory(formEmbedDomainId) {
      try {
        const response = await adminService.getFormEmbedDomainHistory(
          formEmbedDomainId
        );
        return response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.getFormEmbedDomainHistoryErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.getFormEmbedDomainHistoryConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async updateFormEmbedDomainRequest(id, data) {
      try {
        await adminService.updateFormEmbedDomainRequest(id, data);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.updateFormEmbedDomainRequestErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.updateFormEmbedDomainRequestConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async removeFormEmbedDomainRequest(formEmbedDomainId) {
      try {
        await adminService.removeFormEmbedDomainRequest(formEmbedDomainId);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.admin.removeFormEmbedDomainRequestErrMsg'),
          consoleError: i18n.t(
            'trans.store.admin.removeFormEmbedDomainRequestConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
  },
});

import { defineStore } from 'pinia';
import { i18n } from '~/internationalization';
import {
  apiKeyService,
  formService,
  fileService,
  rbacService,
  userService,
} from '~/services';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode, NotificationTypes } from '~/utils/constants';
import { generateIdps, parseIdps } from '~/utils/transformUtils';

const genInitialSchedule = () => ({
  enabled: null,
  scheduleType: null,
  openSubmissionDateTime: null,
  keepOpenForTerm: null,
  keepOpenForInterval: null,
  closingMessageEnabled: null,
  closingMessage: null,
  closeSubmissionDateTime: null,
  repeatSubmission: {
    enabled: null,
    repeatUntil: null,
    everyTerm: null,
    everyIntervalType: null,
  },
  allowLateSubmissions: {
    enabled: null,
    forNext: {
      term: null,
      intervalType: null,
    },
  },
});

const genInitialSubscribe = () => ({
  enabled: null,
});
const genInitialSubscribeDetails = () => ({
  subscribeEvent: '',
  endpointUrl: null,
  endpointToken: null,
  key: '',
});

const genInitialForm = () => ({
  description: '',
  enableSubmitterDraft: false,
  enableStatusUpdates: false,
  allowSubmitterToUploadFile: false,
  id: '',
  idps: [],
  isDirty: false,
  name: '',
  sendSubReceivedEmail: false,
  showSubmissionConfirmation: true,
  snake: '',
  submissionReceivedEmails: [],
  reminder_enabled: false,
  schedule: genInitialSchedule(),
  subscribe: genInitialSubscribe(),
  userType: IdentityMode.TEAM,
  versions: [],
  enableCopyExistingSubmission: false,
});

export const useFormStore = defineStore('form', {
  state: () => ({
    apiKey: undefined,
    downloadedFile: {
      data: null,
      headers: null,
    },
    drafts: [],
    emailTemplates: [],
    fcProactiveHelpGroupList: {},
    fcProactiveHelpImageUrl: '',
    form: genInitialForm(),
    formFields: [],
    formSubmission: {
      confirmationId: '',
      originalName: '',
      submission: {
        data: {},
      },
    },
    formList: [],
    imageList: new Map(),
    lang: 'en',
    isRTL: false,
    permissions: [],
    roles: [],
    submissionList: [],
    submissionUsers: [],
    subscriptionData: genInitialSubscribeDetails(),
    totalSubmissions: 0,
    userFormPreferences: {},
    version: {},
  }),
  getters: {
    isFormPublished: (state) =>
      state?.form?.versions?.length &&
      state.form.versions.some((v) => v.published),
  },
  actions: {
    //
    // Current User
    //
    //
    async getFormsForCurrentUser() {
      try {
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser();
        const data = response.data;
        // Build up the list of forms for the table
        const forms = data.forms.map((f) => ({
          currentVersionId: f.formVersionId,
          id: f.formId,
          idps: f.idps,
          name: f.formName,
          description: f.formDescription,
          permissions: f.permissions,
          published: f.published,
        }));
        this.formList = forms;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.getCurrUserFormsErrMsg'),
          consoleError: i18n.t('trans.store.form.getCurrUserFormsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async getFormPermissionsForUser(formId) {
      try {
        this.permissions = [];
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser({ formId: formId });
        const data = response.data;
        if (data.forms[0]) {
          this.permissions = data.forms[0].permissions;
        } else {
          throw new Error('No form found');
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.getUserFormPermErrMsg'),
          consoleError: i18n.t('trans.store.form.getUserFormPermConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async getFormRolesForUser(formId) {
      try {
        this.roles = [];
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser({ formId: formId });
        const data = response.data;
        if (data.forms[0]) {
          this.roles = data.forms[0].roles;
        } else {
          throw new Error('No form found');
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.getUserFormRolesErrmsg'),
          consoleError: i18n.t('trans.store.form.getUserFormRolesConsErrmsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async getFormPreferencesForCurrentUser(formId) {
      try {
        const response = await userService.getUserFormPreferences(formId);
        this.userFormPreferences = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.getCurrUserFormPrefErrMsg'),
          consoleError: i18n.t('trans.store.form.getCurrUserFormPrefErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async updateFormPreferencesForCurrentUser({ formId, preferences }) {
      try {
        const response = await userService.updateUserFormPreferences(
          formId,
          preferences
        );
        this.userFormPreferences = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.updCurrUserFormPrefErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.updCurrUserFormPrefConsErrMsg',
            {
              formId: formId,
              preferences: preferences,
              error: error,
            }
          ),
        });
      }
    },
    //
    // Form
    //
    async deleteCurrentForm() {
      const notificationStore = useNotificationStore();
      try {
        await formService.deleteForm(this.form.id);
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.delCurrformNotiMsg', {
            name: this.form.name,
          }),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.delCurrformNotiMsg', {
            name: this.form.name,
          }),
          consoleError: i18n.t('trans.store.form.delCurrFormConsErMsg', {
            id: this.form.id,
            error: error,
          }),
        });
      }
    },
    async deleteDraft({ formId, draftId }) {
      try {
        await formService.deleteDraft(formId, draftId);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.delDraftErrMsg'),
          consoleError: i18n.t('trans.store.form.delDraftConsErrMsg', {
            draftId: draftId,
            error: error,
          }),
        });
      }
    },
    async fetchDrafts(formId) {
      try {
        // Get any drafts for this form from the api
        const { data } = await formService.listDrafts(formId);
        this.drafts = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fecthDraftErrMsg'),
          consoleError: i18n.t('trans.store.form.fecthDraftConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async fetchEmailTemplates(formId) {
      try {
        // Get the email templates for this form from the api
        const { data } = await formService.listEmailTemplates(formId);
        this.emailTemplates = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchEmailTemplatesErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.fetchEmailTemplatesConsErrMsg',
            {
              formId,
              error,
            }
          ),
        });
      }
    },
    async fetchForm(formId) {
      try {
        this.apiKey = null;
        // Get the form definition from the api
        const { data } = await formService.readForm(formId);
        const identityProviders = parseIdps(data.identityProviders);
        data.idps = identityProviders.idps;
        data.userType = identityProviders.userType;
        data.sendSubRecieviedEmail =
          data.submissionReceivedEmails && data.submissionReceivedEmails.length;
        data.schedule = {
          ...genInitialSchedule(),
          ...data.schedule,
        };
        data.subscribe = {
          ...genInitialSubscribe(),
          ...data.subscribe,
        };

        this.form = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fecthFormErrMsg'),
          consoleError: i18n.t('trans.store.form.fecthFormErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async fetchFormFields({ formId, formVersionId }) {
      try {
        this.formFields = [];
        const { data } = await formService.readVersionFields(
          formId,
          formVersionId
        );
        this.formFields = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchFormFieldsErrMsg'),
          consoleError: i18n.t('trans.store.form.fetchFormFieldsConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async publishDraft({ formId, draftId }) {
      try {
        await formService.publishDraft(formId, draftId);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.publishDraftErrMsg'),
          consoleError: i18n.t('trans.store.form.publishDraftConsErrMsg', {
            draftId: draftId,
            error: error,
          }),
        });
      }
    },
    async toggleVersionPublish({ formId, versionId, publish }) {
      try {
        await formService.publishVersion(formId, versionId, publish);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: `An error occurred while ${
            publish ? 'publishing' : 'unpublishing'
          }.`,
          consoleError: i18n.t('trans.store.form.toggleVersnPublConsErrMsg', {
            versionId: versionId,
            publish: publish,
            error: error,
          }),
        });
      }
    },
    resetForm() {
      this.form = genInitialForm();
    },
    async updateEmailTemplate(emailTemplate) {
      try {
        await formService.updateEmailTemplate(emailTemplate);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.updateEmailTemplateErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.updateEmailTemplateConsErrMsg',
            {
              formId: emailTemplate.formId,
              error: error,
            }
          ),
        });
      }
    },
    async updateForm() {
      try {
        const emailList =
          this.form.sendSubRecieviedEmail &&
          this.form.submissionReceivedEmails &&
          Array.isArray(this.form.submissionReceivedEmails)
            ? this.form.submissionReceivedEmails
            : [];

        const schedule = this.form.schedule.enabled ? this.form.schedule : {};
        const subscribe = this.form.subscribe.enabled
          ? this.form.subscribe
          : {};

        await formService.updateForm(this.form.id, {
          name: this.form.name,
          description: this.form.description,
          enableSubmitterDraft: this.form.enableSubmitterDraft,
          enableStatusUpdates: this.form.enableStatusUpdates,
          identityProviders: generateIdps({
            idps: this.form.idps,
            userType: this.form.userType,
          }),
          showSubmissionConfirmation: this.form.showSubmissionConfirmation,
          submissionReceivedEmails: emailList,
          schedule: schedule,
          subscribe: subscribe,
          allowSubmitterToUploadFile: this.form.allowSubmitterToUploadFile,
          reminder_enabled: this.form.reminder_enabled
            ? this.form.reminder_enabled
            : false,
          enableCopyExistingSubmission: this.form.enableCopyExistingSubmission
            ? this.form.enableCopyExistingSubmission
            : false,
        });
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.updateFormErrMsg'),
          consoleError: i18n.t('trans.store.form.updateFormConsErrMsg', {
            id: this.form.id,
            error: error,
          }),
        });
      }
    },
    //
    // Submission
    //
    async deleteSubmission(submissionId) {
      try {
        // Get this submission
        await formService.deleteSubmission(submissionId);
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteSubmissionNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteSubmissionErrMsg'),
          consoleError: i18n.t('trans.store.form.deleteSubmissionConsErrMsg', {
            submissionId: submissionId,
            error: error,
          }),
        });
      }
    },

    async deleteMultiSubmissions({ formId, submissionIds }) {
      const notificationStore = useNotificationStore();
      try {
        await formService.deleteMultipleSubmissions(submissionIds[0], formId, {
          data: { submissionIds: submissionIds },
        });
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteSubmissionsNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteSubmissionsErrMsg'),
          consoleError: i18n.t('trans.store.form.deleteSubmissionsConsErrMsg', {
            error: error,
          }),
        });
      }
    },

    async restoreMultiSubmissions({ formId, submissionIds }) {
      const notificationStore = useNotificationStore();
      try {
        // Get this submission
        await formService.restoreMutipleSubmissions(submissionIds[0], formId, {
          submissionIds: submissionIds,
        });
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.restoreSubmissionsNotiMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.restoreSubmissionsErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.restoreSubmissionsConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },

    async restoreSubmission({ submissionId, deleted }) {
      const notificationStore = useNotificationStore();
      try {
        // Get this submission
        await formService.restoreSubmission(submissionId, { deleted });
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteSubmissionsNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.restoreSubmissionsErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.restoreSubmissionsConsErrMsg',
            {
              error: error,
              submissionId: submissionId,
            }
          ),
        });
      }
    },
    async fetchSubmissionUsers(formSubmissionId) {
      try {
        // Get user list for this submission
        const response = await rbacService.getSubmissionUsers({
          formSubmissionId,
        });
        this.submissionUsers = response;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fecthSubmissnUsersErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.fecthSubmissnUsersConsErrMsg',
            { formSubmissionId: formSubmissionId, error: error }
          ),
        });
      }
    },
    async fetchSubmission({ submissionId }) {
      try {
        // Get this submission
        const response = await formService.getSubmission(submissionId);
        this.formSubmission = response.data.submission;
        this.form = response.data.form;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchSubmissnErrMsg'),
          consoleError: i18n.t('trans.store.form.fetchSubmissnConsErrMsg', {
            submissionId: submissionId,
            error: error,
          }),
        });
      }
    },
    async fetchFormCSVExportFields({
      formId,
      type,
      draft,
      deleted,
      version,
      singleRow,
    }) {
      try {
        this.formFields = [];
        const { data } = await formService.readCSVExportFields(
          formId,
          type,
          draft,
          deleted,
          version,
          singleRow
        );
        this.formFields = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchFormCSVExptFieldsErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.fetchFormCSVExptFieldsErrMsg',
            {
              formId: formId,
              error: error,
            }
          ),
        });
      }
    },
    async fetchSubmissions({
      formId,
      userView,
      deletedOnly = false,
      createdBy = '',
      createdAt,
      page,
      paginationEnabled,
      itemsPerPage,
      filterformSubmissionStatusCode,
      sortBy: sortBy,
      search: search,
      searchEnabled: searchEnabled,
    }) {
      try {
        this.submissionList = [];
        // Get list of active submissions for this form (for either all submissions, or just single user)
        const fields =
          this.userFormPreferences && this.userFormPreferences.preferences
            ? this.userFormPreferences.preferences.columns
            : undefined;
        const response = userView
          ? await rbacService.getUserSubmissions({
              formId: formId,
            })
          : await formService.listSubmissions(formId, {
              deleted: deletedOnly,
              fields: fields,
              createdBy: createdBy,
              createdAt: createdAt,
              page: page,
              paginationEnabled: paginationEnabled,
              filterformSubmissionStatusCode: filterformSubmissionStatusCode,
              itemsPerPage: itemsPerPage,
              totalSubmissions: this.totalSubmissions,
              sortBy: sortBy,
              search: search,
              searchEnabled: searchEnabled,
            });
        if (paginationEnabled) {
          this.submissionList = response.data.results;
          this.totalSubmissions = response.data.total;
        } else {
          this.submissionList = response.data;
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchSubmissnsErrMsg'),
          consoleError: i18n.t('trans.store.form.fetchSubmissnsConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async fetchVersion({ formId, versionId }) {
      try {
        // TODO: need a better 'set back to initial state' ability
        this.formSubmission = {
          submission: {
            data: {},
          },
        };
        // Get details about the sepecific form version
        const response = await formService.readVersion(formId, versionId);
        this.version = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.fetchVersionErrMsg'),
          consoleError: i18n.t('trans.store.form.fetchVersionConsErrMsg', {
            versionId: versionId,
            formId: formId,
            error: error,
          }),
        });
      }
    },

    //
    // API Keys
    //
    async deleteApiKey(formId) {
      const notificationStore = useNotificationStore();
      try {
        await apiKeyService.deleteApiKey(formId);
        this.apiKey = null;
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteApiKeyNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.deleteApiKeyErrMsg'),
          consoleError: i18n.t('trans.store.form.deleteApiKeyConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },
    async generateApiKey(formId) {
      const notificationStore = useNotificationStore();
      try {
        const { data } = await apiKeyService.generateApiKey(formId);
        this.apiKey = data;
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.generateApiKeyNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: 'An error occurred while trying to generate an API Key.',
          consoleError: `Error generating API Key for form ${formId}: ${error}`,
        });
      }
    },
    async readApiKey(formId) {
      try {
        const { data } = await apiKeyService.readApiKey(formId);
        this.apiKey = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.generateApiKeyErrMsg'),
          consoleError: i18n.t('trans.store.form.generateApiKeyConsErrMsg', {
            formId: formId,
            error: error,
          }),
        });
      }
    },

    async getFCProactiveHelpImageUrl(componentId) {
      try {
        this.fcProactiveHelpImageUrl = {};
        const response = this.imageList.get(componentId);
        if (response) {
          this.fcProactiveHelpImageUrl = response.data.url;
        } else {
          const response = await formService.getFCProactiveHelpImageUrl(
            componentId
          );
          this.imageList.set(componentId, response);
          this.fcProactiveHelpImageUrl = response.data.url;
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.getFCPHImageUrlErrMsg'),
          consoleError: i18n.t('trans.store.form.getFCPHImageUrlConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    //listFormComponentsProactiveHelp
    async listFCProactiveHelp() {
      try {
        // Get Form Components Proactive Help Group Object
        this.fcProactiveHelpGroupList = {};
        const response = await formService.listFCProactiveHelp();
        this.fcProactiveHelpGroupList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.listFCPHErrMsg'),
          consoleError: i18n.t('trans.store.form.listFCPHConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async setDirtyFlag(isDirty) {
      // When the form is detected to be dirty set the browser guards for closing the tab etc
      // There are also Vue route-specific guards so that we can ask before navigating away with the links
      // Look for those in the Views for the relevant pages, look for "beforeRouteLeave" lifecycle
      if (!this.form || this.form.isDirty === isDirty) return; // don't do anything if not changing the val (or if form is blank for some reason)
      this.form.isDirty = isDirty;
    },
    async setMultiLanguage(lang) {
      this.lang = lang;
      if (lang === 'ar' || lang === 'fa') {
        this.isRTL = true;
      } else {
        this.isRTL = false;
      }
    },
    async downloadFile(fileId) {
      try {
        this.downloadedFile.data = null;
        this.downloadedFile.headers = null;
        const response = await fileService.getFile(fileId);
        this.downloadedFile.data = response.data;
        this.downloadedFile.headers = response.headers;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.downloadFileErrMsg'),
          consoleError: i18n.t('trans.store.form.downloadFileConsErrMsg', {
            error: error,
          }),
        });
      }
    },
    async readFormSubscriptionData(formId) {
      try {
        const { data } = await formService.readFormSubscriptionData(formId);
        if (data) {
          this.subscriptionData = data;
        }
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.readSubscriptionSettingsErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.readSubscriptionSettingsConsErrMsg',
            {
              formId: formId,
              error: error,
            }
          ),
        });
      }
    },
    async updateSubscription({ formId, subscriptionData }) {
      try {
        const { data } = await formService.updateSubscription(
          formId,
          subscriptionData
        );
        if (data) {
          this.subscriptionData = data;
        }
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.saveSubscriptionSettingsNotifyMsg'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.form.saveSubscriptionSettingsErrMsg'),
          consoleError: i18n.t(
            'trans.store.form.saveSubscriptionSettingsConsErrMsg',
            {
              formId: formId,
              error: error,
            }
          ),
        });
      }
    },
  },
});

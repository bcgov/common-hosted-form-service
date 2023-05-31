import { defineStore } from 'pinia';
import { apiKeyService, formService, rbacService } from '~/services';
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

const genInitialForm = () => ({
  description: '',
  enableSubmitterDraft: false,
  enableStatusUpdates: false,
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
  userType: IdentityMode.TEAM,
  versions: [],
  enableCopyExistingSubmission: false,
});

export const useFormStore = defineStore('form', {
  state: () => ({
    apiKey: undefined,
    drafts: [],
    fcProactiveHelpGroupList: {},
    fcProactiveHelpImageUrl: '',
    form: genInitialForm(),
    formList: [],
    imageList: new Map(),
    permissions: [],
  }),
  getters: {
    isFormPublished: (state) =>
      state?.form?.versions?.length &&
      state.form.versions.some((v) => v.published),
  },
  actions: {
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
          text: 'An error occurred while fetching your forms.',
          consoleError: `Error getting user data: ${error}`,
        });
      }
    },
    async deleteDraft(formId, draftId) {
      try {
        await formService.deleteDraft(formId, draftId);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: 'An error occurred while deleting this draft.',
          consoleError: `Error deleting ${draftId}: ${error}`,
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
          text: 'An error occurred while scanning for drafts for this form.',
          consoleError: `Error getting drafts for form ${formId}: ${error}`,
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

        this.form = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: 'An error occurred while fetching this form.',
          consoleError: `Error getting form ${formId}: ${error}`,
        });
      }
    },
    async publishDraft(formId, draftId) {
      try {
        await formService.publishDraft(formId, draftId);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: 'An error occurred while publishing.',
          consoleError: `Error publishing ${draftId}: ${error}`,
        });
      }
    },
    async toggleVersionPublish({ formId, versionId, publish }) {
      try {
        await formService.publishVersion(formId, versionId, publish);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification(
          {
            text: `An error occurred while ${
              publish ? 'publishing' : 'unpublishing'
            }.`,
            consoleError: `Error in toggleVersionPublish ${versionId} ${publish}: ${error}`,
          },
          { root: true }
        );
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
          text: 'An error occurred while fetching your user data for this form.',
          consoleError: `Error getting user data using formID ${formId}: ${error}`,
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

        // const reminder = this.form.schedule.enabled ?  : false ;

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
          text: 'An error occurred while updating the settings for this form.',
          consoleError: `Error updating form ${this.form.id}: ${error}`,
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
          text: 'The API Key for this form has been deleted.',
          ...NotificationTypes.SUCCESS,
        });
      } catch (error) {
        notificationStore.addNotification({
          text: 'An error occurred while trying to delete the API Key.',
          consoleError: `Error deleting API Key for form ${formId}: ${error}`,
        });
      }
    },
    async generateApiKey(formId) {
      const notificationStore = useNotificationStore();
      try {
        const { data } = await apiKeyService.generateApiKey(formId);
        this.apiKey = data;
        notificationStore.addNotification({
          text: 'An API Key for this form has been created.',
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
          text: 'An error occurred while trying to fetch the API Key.',
          consoleError: `Error getting API Key for form ${formId}: ${error}`,
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
          text: 'An error occurred while getting image url',
          consoleError: 'Error getting image url',
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
  },
});

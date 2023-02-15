import { getField, updateField } from 'vuex-map-fields';

import { IdentityMode, NotificationTypes } from '@/utils/constants';
import { apiKeyService, formService, rbacService, userService} from '@/services';
import { generateIdps, parseIdps } from '@/utils/transformUtils';


const genInitialForm = () => ({
  description: '',
  enableSubmitterDraft: false,
  enableStatusUpdates: false,
  id: '',
  idps: [],
  isDirty: false,
  name: '',
  sendSubRecieviedEmail: false,
  showSubmissionConfirmation: true,
  snake: '',
  submissionReceivedEmails: [],
  userType: IdentityMode.TEAM,
  versions: [],
});

/**
 * Form Module
 */
export default {
  namespaced: true,
  state: {
    apiKey: undefined,
    drafts: [],
    form: genInitialForm(),
    formFields: [],
    formList: [],
    formSubmission: {
      confirmationId: '',
      submission: {
        data: {}
      }
    },
    permissions: [],
    submissionList: [],
    submissionUsers: [],
    userFormPreferences: {},
    version: {},
    fcProactiveHelpGroupList:{},
    imageList:new Map(),
    fcProactiveHelpImageUrl:'',
  },
  getters: {
    getField, // vuex-map-fields
    apiKey: state => state.apiKey,
    drafts: state => state.drafts,
    form: state => state.form,
    formFields: state => state.formFields,
    formList: state => state.formList,
    formSubmission: state => state.formSubmission,
    permissions: state => state.permissions,
    submissionList: state => state.submissionList,
    submissionUsers: state => state.submissionUsers,
    userFormPreferences: state => state.userFormPreferences,
    fcNamesProactiveHelpList: state => state.fcNamesProactiveHelpList, // Form Components Proactive Help Group Object
    version: state => state.version,
    builder: state => state.builder,
    fcProactiveHelpGroupList:state=>state.fcProactiveHelpGroupList,
    fcProactiveHelpImageUrl:state=>state.fcProactiveHelpImageUrl,
  },
  mutations: {
    updateField, // vuex-map-fields
    ADD_FORM_TO_LIST(state, form) {
      state.formList.push(form);
    },
    ADD_SUBMISSION_TO_LIST(state, submission) {
      state.submissionList.push(submission);
    },
    SET_API_KEY(state, apiKey) {
      state.apiKey = apiKey;
    },
    SET_DRAFTS(state, drafts) {
      state.drafts = drafts;
    },
    SET_FORM(state, form) {
      state.form = form;
    },
    SET_FORM_FIELDS(state, formFields) {
      state.formFields = formFields;
    },
    SET_FORM_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
    },
    SET_FORMLIST(state, forms) {
      state.formList = forms;
    },
    SET_FORMSUBMISSION(state, submission) {
      state.formSubmission = submission;
    },
    SET_SUBMISSIONLIST(state, submissions) {
      state.submissionList = submissions;
    },
    SET_SUBMISSIONUSERS(state, users) {
      state.submissionUsers = users;
    },
    SET_USER_FORM_PREFERENCES(state, userFormPreferences) {
      state.userFormPreferences = userFormPreferences;
    },
    SET_VERSION(state, version) {
      state.version = version;
    },
    SET_BUILDER(state, builder) {
      state.builder = builder;
    },

    SET_FORM_DIRTY(state, isDirty) {
      state.form.isDirty = isDirty;
    },
    //Form Component Proactive Help Group Object
    SET_FCPROACTIVEHELPGROUPLIST(state,fcProactiveHelpGroupList){
      state.fcProactiveHelpGroupList = fcProactiveHelpGroupList;
    },
    SET_FCPROACTIVEHELPIMAGEURL(state,fcProactiveHelpImageUrl)
    {
      state.fcProactiveHelpImageUrl = fcProactiveHelpImageUrl;
    },
  },
  actions: {
    //
    // Current User
    //
    //
    async getFormsForCurrentUser({ commit, dispatch }) {
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
          published: f.published
        }));
        commit('SET_FORMLIST', forms);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching your forms.',
          consoleError: `Error getting user data: ${error}`,
        }, { root: true });
      }
    },
    async getFormPermissionsForUser({ commit, dispatch }, formId) {
      try {
        commit('SET_FORM_PERMISSIONS', []);
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser({ formId: formId });
        const data = response.data;
        if (data.forms[0]) {
          commit('SET_FORM_PERMISSIONS', data.forms[0].permissions);
        } else {
          throw new Error('No form found');
        }
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching your user data for this form.',
          consoleError: `Error getting user data using formID ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async getFormPreferencesForCurrentUser({ commit, dispatch }, formId) {
      try {
        const response = await userService.getUserFormPreferences(formId);
        commit('SET_USER_FORM_PREFERENCES', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching your preferences for this form.',
          consoleError: `Error getting user form prefs using formID ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async updateFormPreferencesForCurrentUser({ commit, dispatch }, { formId, preferences }) {
      try {
        const response = await userService.updateUserFormPreferences(formId, preferences);
        commit('SET_USER_FORM_PREFERENCES', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while saving your preferences for this form.',
          consoleError: `Error updating user form prefs using formID ${formId}, and prefs ${preferences}: ${error}`,
        }, { root: true });
      }
    },

    //
    // Form
    //
    async deleteCurrentForm({ state, dispatch }) {
      try {
        await formService.deleteForm(state.form.id);
        dispatch('notifications/addNotification', {
          message: `Form "${state.form.name}" has been deleted successfully.`,
          ...NotificationTypes.SUCCESS,
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: `An error occurred while attempting to delete "${state.form.name}".`,
          consoleError: `Error deleting form ${state.form.id}: ${error}`,
        }, { root: true });
      }
    },
    async deleteDraft({ dispatch }, { formId, draftId }) {
      try {
        await formService.deleteDraft(formId, draftId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while deleting this draft.',
          consoleError: `Error deleting ${draftId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchDrafts({ commit, dispatch }, formId) {
      try {
        // Get any drafts for this form from the api
        const { data } = await formService.listDrafts(formId);
        commit('SET_DRAFTS', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while scanning for drafts for this form.',
          consoleError: `Error getting drafts for form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchForm({ commit, dispatch }, formId) {
      try {

        commit('SET_API_KEY', null);
        // Get the form definition from the api
        const { data } = await formService.readForm(formId);
        const identityProviders = parseIdps(data.identityProviders);
        data.idps = identityProviders.idps;
        data.userType = identityProviders.userType;
        data.sendSubRecieviedEmail = data.submissionReceivedEmails && data.submissionReceivedEmails.length;
        commit('SET_FORM', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form.',
          consoleError: `Error getting form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchFormFields({ commit, dispatch }, { formId, formVersionId }) {
      try {
        commit('SET_FORM_FIELDS', []);
        const { data } = await formService.readVersionFields(formId, formVersionId);
        commit('SET_FORM_FIELDS', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching the list of fields for this form.',
          consoleError: `Error getting form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async publishDraft({ dispatch }, { formId, draftId }) {
      try {
        await formService.publishDraft(formId, draftId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while publishing.',
          consoleError: `Error publishing ${draftId}: ${error}`,
        }, { root: true });
      }
    },
    async toggleVersionPublish({ dispatch }, { formId, versionId, publish }) {
      try {
        await formService.publishVersion(formId, versionId, publish);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: `An error occurred while ${publish ? 'publishing' : 'unpublishing'}.`,
          consoleError: `Error in toggleVersionPublish ${versionId} ${publish}: ${error}`,
        }, { root: true });
      }
    },
    resetForm({ commit }) {
      commit('SET_FORM', genInitialForm());
    },
    async updateForm({ state, dispatch }) {
      try {
        const emailList =
          state.form.sendSubRecieviedEmail &&
            state.form.submissionReceivedEmails &&
            Array.isArray(state.form.submissionReceivedEmails)
            ? state.form.submissionReceivedEmails
            : [];
        await formService.updateForm(state.form.id, {
          name: state.form.name,
          description: state.form.description,
          enableSubmitterDraft: state.form.enableSubmitterDraft,
          enableStatusUpdates: state.form.enableStatusUpdates,
          identityProviders: generateIdps({
            idps: state.form.idps,
            userType: state.form.userType,
          }),
          showSubmissionConfirmation: state.form.showSubmissionConfirmation,
          submissionReceivedEmails: emailList
        });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while updating the settings for this form.',
          consoleError: `Error updating form ${state.form.id}: ${error}`,
        }, { root: true });
      }
    },

    //
    // Submission
    //
    async deleteSubmission({ dispatch }, submissionId) {
      try {
        // Get this submission
        await formService.deleteSubmission(submissionId);
        dispatch('notifications/addNotification', {
          message: 'Submission deleted successfully.',
          ...NotificationTypes.SUCCESS,
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while deleting this submission.',
          consoleError: `Error deleting submission ${submissionId}: ${error}`,
        }, { root: true });
      }
    },
    async restoreSubmission({ dispatch }, { submissionId, deleted }) {
      try {
        // Get this submission
        await formService.restoreSubmission(submissionId, { deleted });
        dispatch('notifications/addNotification', {
          message: 'Submission restored successfully.',
          ...NotificationTypes.SUCCESS,
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while restoring this submission.',
          consoleError: `Error restoring submission ${submissionId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchSubmissionUsers({ commit, dispatch }, formSubmissionId) {
      try {
        // Get user list for this submission
        const response = await rbacService.getSubmissionUsers({ formSubmissionId });
        commit('SET_SUBMISSIONUSERS', response);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching the recipient email for this submission.',
          consoleError: `Error getting recipient email for submission ${formSubmissionId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchSubmission({ commit, dispatch }, { submissionId }) {
      try {
        // Get this submission
        const response = await formService.getSubmission(
          submissionId
        );
        commit('SET_FORMSUBMISSION', response.data.submission);
        commit('SET_FORM', response.data.form);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this submission.',
          consoleError: `Error getting submission ${submissionId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchSubmissions({ commit, dispatch, state }, { formId, userView, deletedOnly = false, createdBy = '' }) {
      try {
        commit('SET_SUBMISSIONLIST', []);
        // Get list of active submissions for this form (for either all submissions, or just single user)
        const fields = state.userFormPreferences &&
          state.userFormPreferences.preferences ? state.userFormPreferences.preferences.columns : undefined;
        const response = userView
          ? await rbacService.getUserSubmissions({ formId: formId })
          : await formService.listSubmissions(formId, { deleted: deletedOnly, fields: fields, createdBy: createdBy  });
        commit('SET_SUBMISSIONLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching submissions for this form.',
          consoleError: `Error getting submissions for ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchVersion({ commit, dispatch }, { formId, versionId }) {
      try {
        // TODO: need a better 'set back to initial state' ability
        commit('SET_FORMSUBMISSION', {
          submission: {
            data: {}
          }
        });
        // Get details about the sepecific form version
        const response = await formService.readVersion(
          formId,
          versionId
        );
        commit('SET_VERSION', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form.',
          consoleError: `Error getting version ${versionId} for form ${formId}: ${error}`,
        }, { root: true });
      }
    },

    //
    // API Keys
    //
    async deleteApiKey({ commit, dispatch }, formId) {
      try {
        await apiKeyService.deleteApiKey(formId);
        commit('SET_API_KEY', null);
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
    async generateApiKey({ commit, dispatch }, formId) {
      try {
        const { data } = await apiKeyService.generateApiKey(formId);
        commit('SET_API_KEY', data);
        dispatch('notifications/addNotification', {
          message:
            'An API Key for this form has been created.',
          ...NotificationTypes.SUCCESS
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to generate an API Key.',
          consoleError: `Error generating API Key for form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async readApiKey({ commit, dispatch }, formId) {
      try {
        const { data } = await apiKeyService.readApiKey(formId);
        commit('SET_API_KEY', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to fetch the API Key.',
          consoleError: `Error getting API Key for form ${formId}: ${error}`,
        }, { root: true });
      }
    },

    async getFCProactiveHelpImageUrl({ commit, dispatch, state },componentId) {
      try {
        // Get Common Components Help Information
        commit('SET_FCPROACTIVEHELPIMAGEURL',{});
        const response = state.imageList.get(componentId);
        if(response) {

          commit('SET_FCPROACTIVEHELPIMAGEURL',response.data.url);
        }
        else {
          const response = await formService.getFCProactiveHelpImageUrl(componentId);
          state.imageList.set(componentId, response);
          commit('SET_FCPROACTIVEHELPIMAGEURL',response.data.url);
        }
      } catch(error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while getting image url',
          consoleError: 'Error getting image url',
        }, { root: true });
      }
    },

    //listFormComponentsProactiveHelp
    async listFCProactiveHelp({ commit, dispatch }) {
      try {
        // Get Form Components Proactive Help Group Object
        commit('SET_FCPROACTIVEHELPGROUPLIST',{});
        const response = await formService.listFCProactiveHelp();
        commit('SET_FCPROACTIVEHELPGROUPLIST',response.data);
      } catch(error) {

        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching form builder components',
          consoleError: 'Error getting form builder components',
        }, { root: true });
      }
    },
    async setDirtyFlag({ commit, state }, isDirty) {
      // When the form is detected to be dirty set the browser guards for closing the tab etc
      // There are also Vue route-specific guards so that we can ask before navigating away with the links
      // Look for those in the Views for the relevant pages, look for "beforeRouteLeave" lifecycle
      if (!state.form || state.form.isDirty === isDirty) return; // don't do anything if not changing the val (or if form is blank for some reason)
      window.onbeforeunload = isDirty ? () => true : null;
      commit('SET_FORM_DIRTY', isDirty);
    },
  },
};
